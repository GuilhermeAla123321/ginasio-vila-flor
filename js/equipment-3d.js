/* Visualizador 3D local dos equipamentos que têm um modelo GLB disponível. */
(() => {
    const MODEL_URL = new URL("../assets/models/pec-fly.glb", import.meta.url).href;
    const TRANSITION_MS = 240;

    let modal = null;
    let lastTrigger = null;
    let isOpen = false;
    let viewerToken = 0;
    let closeTimer = null;
    let autoRotateResumeTimer = null;
    let resizeFallbackBound = false;
    let animationFrame = null;
    let resizeObserver = null;
    let THREE = null;
    let GLTFLoader = null;
    let OrbitControls = null;
    let RoomEnvironment = null;
    let renderer = null;
    let scene = null;
    let environmentTarget = null;
    let camera = null;
    let controls = null;
    let model = null;
    let loadingModel = false;
    let loadingToken = 0;

    function createModal() {
        if (modal) return modal;

        modal = document.createElement("div");
        modal.className = "equipment-3d-overlay";
        modal.id = "equipment3DModal";
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = `
            <section class="equipment-3d-panel" role="dialog" aria-modal="true" aria-labelledby="equipment3DTitle" tabindex="-1">
                <header class="equipment-3d-header">
                    <div>
                        <span class="equipment-3d-eyebrow">EXPLORA EM 3D</span>
                        <h2 id="equipment3DTitle">Peck Deck</h2>
                    </div>
                    <button class="equipment-3d-close" type="button" aria-label="Fechar visualização 3D" title="Fechar">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>
                    </button>
                </header>
                <div class="equipment-3d-content">
                    <div class="equipment-3d-stage-wrap">
                        <div class="equipment-3d-stage">
                            <canvas id="equipment3DCanvas" aria-label="Modelo 3D interativo do Peck Deck"></canvas>
                            <div class="equipment-3d-loading" role="status" aria-live="polite">
                                <span class="equipment-3d-spinner" aria-hidden="true"></span>
                                <p>A preparar o equipamento 3D…</p>
                            </div>
                            <div class="equipment-3d-error" role="alert" hidden>
                                <span class="equipment-3d-error-icon" aria-hidden="true">!</span>
                                <p>Não foi possível carregar o modelo 3D neste dispositivo.</p>
                                <button class="equipment-3d-retry" type="button">Tentar novamente</button>
                            </div>
                        </div>
                    </div>
                    <aside class="equipment-3d-details">
                        <span class="equipment-3d-pill"><span aria-hidden="true"></span> Modelo interativo</span>
                        <h3>Peck Deck</h3>
                        <p>Explora a máquina de diferentes ângulos antes de começares o treino. Roda o modelo com o rato ou com o dedo e ajusta a aproximação para veres melhor os detalhes.</p>
                        <div class="equipment-3d-feature">
                            <span class="equipment-3d-feature-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg>
                            </span>
                            <div><strong>Vista livre</strong><span>Roda 360° e aproxima a máquina.</span></div>
                        </div>
                        <div class="equipment-3d-feature">
                            <span class="equipment-3d-feature-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h11M4 17h8"/><circle cx="18" cy="16" r="3"/></svg>
                            </span>
                            <div><strong>Exploração simples</strong><span>Sem sair da página de exercícios.</span></div>
                        </div>
                        <p class="equipment-3d-footnote">Modelo digital ilustrativo. O equipamento real pode apresentar diferenças.</p>
                    </aside>
                </div>
            </section>
        `;
        document.body.appendChild(modal);

        modal.querySelector(".equipment-3d-close").addEventListener("click", closeModal);
        modal.querySelector(".equipment-3d-retry").addEventListener("click", () => {
            if (!isOpen) return;
            const token = ++viewerToken;
            showLoading();
            startViewer(token);
        });
        modal.addEventListener("click", event => {
            if (event.target === modal) closeModal();
        });
        return modal;
    }

    function showLoading() {
        if (!modal) return;
        modal.querySelector(".equipment-3d-loading").hidden = false;
        modal.querySelector(".equipment-3d-error").hidden = true;
    }

    function showError() {
        if (!modal) return;
        modal.querySelector(".equipment-3d-loading").hidden = true;
        modal.querySelector(".equipment-3d-error").hidden = false;
    }

    function showLoaded() {
        if (!modal) return;
        modal.querySelector(".equipment-3d-loading").hidden = true;
        modal.querySelector(".equipment-3d-error").hidden = true;
    }

    function openModal(trigger) {
        createModal();
        if (closeTimer) {
            window.clearTimeout(closeTimer);
            closeTimer = null;
        }

        lastTrigger = trigger;
        isOpen = true;
        if (autoRotateResumeTimer) {
            window.clearTimeout(autoRotateResumeTimer);
            autoRotateResumeTimer = null;
        }
        if (controls) controls.autoRotate = true;
        const token = ++viewerToken;
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.documentElement.classList.add("equipment-3d-lock-scroll");
        document.body.classList.add("equipment-3d-lock-scroll");
        showLoading();
        window.requestAnimationFrame(() => modal?.classList.add("is-open"));
        modal.querySelector(".equipment-3d-close").focus({ preventScroll: true });
        startViewer(token);
    }

    function closeModal() {
        if (!modal || !isOpen) return;
        isOpen = false;
        ++viewerToken;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("equipment-3d-lock-scroll");
        document.body.classList.remove("equipment-3d-lock-scroll");
        if (animationFrame !== null) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        if (autoRotateResumeTimer) {
            window.clearTimeout(autoRotateResumeTimer);
            autoRotateResumeTimer = null;
        }
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (resizeFallbackBound) {
            window.removeEventListener("resize", fitRendererToStage);
            resizeFallbackBound = false;
        }

        closeTimer = window.setTimeout(() => {
            modal.hidden = true;
            destroyViewer();
            closeTimer = null;
        }, TRANSITION_MS);

        if (lastTrigger && lastTrigger.isConnected) {
            lastTrigger.focus({ preventScroll: true });
        }
    }

    function destroyViewer() {
        if (controls) {
            controls.dispose();
            controls = null;
        }
        if (scene && model) {
            model.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.filter(Boolean).forEach(material => {
                    Object.values(material).forEach(value => {
                        if (value && value.isTexture && typeof value.dispose === "function") value.dispose();
                    });
                    material.dispose?.();
                });
            });
        }
        if (environmentTarget) {
            environmentTarget.dispose();
            environmentTarget = null;
        }
        if (renderer) {
            try { renderer.dispose(); } catch (_) { /* A falha de limpeza não deve bloquear a página. */ }
            try { renderer.forceContextLoss(); } catch (_) { /* Nem todos os dispositivos expõem este método. */ }
            renderer = null;
        }
        scene = null;
        camera = null;
        model = null;
        loadingModel = false;
        loadingToken = 0;

        const canvas = modal?.querySelector("#equipment3DCanvas");
        if (canvas) {
            const replacement = document.createElement("canvas");
            replacement.id = "equipment3DCanvas";
            replacement.setAttribute("aria-label", "Modelo 3D interativo do Peck Deck");
            canvas.replaceWith(replacement);
        }
    }

    async function startViewer(token) {
        try {
            if (!THREE || !GLTFLoader || !OrbitControls) {
                const modules = await Promise.all([
                    import("../assets/vendor/three/build/three.module.js"),
                    import("../assets/vendor/three/examples/jsm/loaders/GLTFLoader.js"),
                    import("../assets/vendor/three/examples/jsm/controls/OrbitControls.js"),
                    import("../assets/vendor/three/examples/jsm/environments/RoomEnvironment.js")
                ]);
                if (!isOpen || token !== viewerToken) return;
                THREE = modules[0];
                GLTFLoader = modules[1].GLTFLoader;
                OrbitControls = modules[2].OrbitControls;
                RoomEnvironment = modules[3].RoomEnvironment;
            }
            if (!isOpen || token !== viewerToken) return;

            if (!renderer) {
                const canvas = modal.querySelector("#equipment3DCanvas");
                renderer = new THREE.WebGLRenderer({
                    canvas,
                    antialias: true,
                    alpha: false,
                    powerPreference: "low-power"
                });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.12;
                renderer.setClearColor(0xffffff, 1);

                scene = new THREE.Scene();
                scene.background = new THREE.Color(0xffffff);
                camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
                scene.add(new THREE.HemisphereLight(0xffffff, 0xc9cbd0, 2.0));

                const key = new THREE.DirectionalLight(0xffffff, 3.1);
                key.position.set(4, 6, 5);
                scene.add(key);
                const fill = new THREE.DirectionalLight(0xe9edff, 1.7);
                fill.position.set(-5, 2.5, 2.5);
                scene.add(fill);
                const rim = new THREE.DirectionalLight(0xffffff, 2.2);
                rim.position.set(0, 4, -5);
                scene.add(rim);

                // Ambiente de estúdio para dar reflexos suaves ao metal sem escurecer o fundo branco.
                const pmrem = new THREE.PMREMGenerator(renderer);
                const environment = new RoomEnvironment(renderer);
                environmentTarget = pmrem.fromScene(environment, 0.04);
                scene.environment = environmentTarget.texture;
                scene.environmentIntensity = 1.05;
                environment.dispose();
                pmrem.dispose();
            }

            if (!controls) {
                controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.055;
                controls.enablePan = false;
                controls.autoRotate = true;
                controls.autoRotateSpeed = 1.0;
                controls.minDistance = 1.3;
                controls.maxDistance = 12;
                controls.maxPolarAngle = Math.PI * 0.49;
                controls.addEventListener("start", () => {
                    controls.autoRotate = false;
                    if (autoRotateResumeTimer) window.clearTimeout(autoRotateResumeTimer);
                    autoRotateResumeTimer = null;
                });
                controls.addEventListener("end", () => {
                    if (autoRotateResumeTimer) window.clearTimeout(autoRotateResumeTimer);
                    autoRotateResumeTimer = window.setTimeout(() => {
                        if (isOpen && controls) controls.autoRotate = true;
                        autoRotateResumeTimer = null;
                    }, 1500);
                });
            }

            fitRendererToStage();
            if (model) {
                showLoaded();
                startRenderLoop(token);
                return;
            }
            if (loadingModel && loadingToken === token) return;
            loadingModel = true;
            loadingToken = token;
            const loader = new GLTFLoader();
            loader.load(
                MODEL_URL,
                gltf => {
                    if (loadingToken === token) loadingModel = false;
                    if (!isOpen || token !== viewerToken || !scene || !renderer) return;
                    model = gltf.scene;
                    const bounds = new THREE.Box3().setFromObject(model);
                    const size = bounds.getSize(new THREE.Vector3());
                    const center = bounds.getCenter(new THREE.Vector3());
                    model.position.sub(center);
                    scene.add(model);
                    frameModel(size);
                    showLoaded();
                    startRenderLoop(token);
                },
                progress => {
                    if (!isOpen || token !== viewerToken) return;
                    const label = modal.querySelector(".equipment-3d-loading p");
                    if (progress.lengthComputable && label) {
                        label.textContent = `A carregar o modelo 3D… ${Math.round(progress.loaded / progress.total * 100)}%`;
                    }
                },
                () => {
                    if (loadingToken === token) loadingModel = false;
                    if (!isOpen || token !== viewerToken) return;
                    showError();
                }
            );
            startRenderLoop(token);
        } catch (error) {
            loadingModel = false;
            if (window.console?.warn) console.warn("Não foi possível iniciar o visualizador 3D:", error);
            if (isOpen && token === viewerToken) showError();
        }
    }

    function frameModel(size) {
        if (!camera || !controls || !THREE) return;
        const maxDimension = Math.max(size.x, size.y, size.z, 0.1);
        const distance = maxDimension / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.28;
        camera.position.set(distance * 0.64, distance * 0.31, distance * 0.70);
        camera.near = Math.max(maxDimension / 1000, 0.001);
        camera.far = maxDimension * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.minDistance = maxDimension * 0.7;
        controls.maxDistance = maxDimension * 5.5;
        controls.update();
    }

    function fitRendererToStage() {
        const stage = modal?.querySelector(".equipment-3d-stage");
        if (!stage || !renderer || !camera) return;
        const bounds = stage.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        renderer.setSize(Math.round(bounds.width), Math.round(bounds.height), false);
        camera.aspect = bounds.width / bounds.height;
        camera.updateProjectionMatrix();
    }

    function startResizeObserver() {
        if (resizeObserver) resizeObserver.disconnect();
        const stage = modal?.querySelector(".equipment-3d-stage");
        if (!stage || typeof ResizeObserver === "undefined") {
            if (!resizeFallbackBound) {
                window.addEventListener("resize", fitRendererToStage, { passive: true });
                resizeFallbackBound = true;
            }
            return;
        }
        resizeObserver = new ResizeObserver(fitRendererToStage);
        resizeObserver.observe(stage);
    }

    function startRenderLoop(token) {
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        const render = () => {
            if (!isOpen || token !== viewerToken || !renderer || !scene || !camera || !controls) {
                animationFrame = null;
                return;
            }
            animationFrame = window.requestAnimationFrame(render);
            controls.update();
            renderer.render(scene, camera);
        };
        fitRendererToStage();
        startResizeObserver();
        render();
    }

    document.addEventListener("click", event => {
        const trigger = event.target.closest?.("#showEquipment3D");
        if (!trigger) return;
        event.preventDefault();
        event.stopPropagation();
        openModal(trigger);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            closeModal();
            return;
        }
        if (!isOpen || event.key !== "Tab" || !modal) return;
        const focusable = [...modal.querySelectorAll("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
            .filter(element => !element.hidden && element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    // Cria apenas a estrutura acessível; o motor 3D e o modelo são carregados sob pedido.
    createModal();
})();
