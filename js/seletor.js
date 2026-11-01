/* =========================================================
   SELETOR PRÓPRIO
   Substitui o menu nativo das <select> por um menu da aplicação.
   A <select> continua visível (mantém o estilo de cada ecrã) e guarda o valor;
   um botão transparente por cima abre o menu, por isso o código existente
   que lê .value ou ouve "change" continua a funcionar sem alterações.
   ========================================================= */
(() => {
    const MARCA = "vfSelect";
    let menuAberto = null;

    function textoOpcao(option) {
        return (option.label || option.textContent || "").trim();
    }

    function etiquetaDe(select) {
        if (select.getAttribute("aria-label")) return select.getAttribute("aria-label");
        const label = select.id ? document.querySelector(`label[for="${CSS.escape(select.id)}"]`) : null;
        return label ? label.textContent.trim() : "";
    }

    function melhorar(select) {
        if (select.dataset[MARCA] || select.multiple || select.size > 1) return;
        select.dataset[MARCA] = "1";

        const estilo = getComputedStyle(select);
        const envolvente = document.createElement("span");
        envolvente.className = "vf-select";
        const pai = select.parentElement;
        const larguraUtil = pai.clientWidth - parseFloat(getComputedStyle(pai).paddingLeft) - parseFloat(getComputedStyle(pai).paddingRight);
        // Sem medição possível (ecrã ainda escondido), assume largura total como as listas da app.
        const ocupaLinha = !select.offsetParent || select.classList.contains("input") || estilo.display === "block"
            || select.offsetWidth >= larguraUtil - 2;
        envolvente.style.display = ocupaLinha ? "block" : "inline-block";
        if (ocupaLinha) envolvente.style.width = "100%";
        // Propriedades longas uma a uma: o Safari devolve "" para os atalhos margin/flex.
        ["marginTop", "marginRight", "marginBottom", "marginLeft", "flexGrow", "flexShrink", "flexBasis"].forEach(prop => {
            envolvente.style[prop] = estilo[prop];
        });
        envolvente.style.alignSelf = estilo.alignSelf;
        if (parseFloat(estilo.flexGrow) > 0) select.style.width = "100%";

        select.parentNode.insertBefore(envolvente, select);
        envolvente.appendChild(select);
        select.style.margin = "0";
        select.classList.add("vf-select-native");
        select.tabIndex = -1;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "vf-select-trigger";
        botao.setAttribute("aria-haspopup", "listbox");
        botao.setAttribute("aria-expanded", "false");
        envolvente.appendChild(botao);

        const atualizarNome = () => {
            const atual = select.options[select.selectedIndex];
            const nome = etiquetaDe(select);
            botao.setAttribute("aria-label", `${nome}${nome ? ": " : ""}${atual ? textoOpcao(atual) : ""}`);
            botao.disabled = select.disabled;
        };
        atualizarNome();
        select.addEventListener("change", atualizarNome);

        // Clique na <label> ou select.focus() vindo do código passam o foco para o botão.
        select.addEventListener("focus", () => botao.focus({ preventScroll: true }));
        select.focus = options => botao.focus(options);
        if (select.id) {
            document.querySelectorAll(`label[for="${CSS.escape(select.id)}"]`).forEach(label => {
                label.addEventListener("click", event => {
                    event.preventDefault();
                    botao.focus({ preventScroll: true });
                });
            });
        }
        botao.addEventListener("focus", () => { atualizarNome(); select.classList.add("vf-select-focused"); });
        botao.addEventListener("blur", () => select.classList.remove("vf-select-focused"));

        botao.addEventListener("click", () => {
            if (menuAberto?.select === select) fecharMenu(true);
            else abrirMenu(select, botao);
        });
        botao.addEventListener("keydown", event => {
            if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
                abrirMenu(select, botao);
            }
        });
    }

    function abrirMenu(select, botao) {
        fecharMenu(false);
        if (select.disabled) return;

        const lista = document.createElement("div");
        lista.className = "vf-select-menu";
        lista.setAttribute("role", "listbox");
        lista.tabIndex = -1;
        const nome = etiquetaDe(select);
        if (nome) lista.setAttribute("aria-label", nome);

        const opcoes = [...select.options].filter(o => !o.hidden);
        opcoes.forEach((option, i) => {
            const item = document.createElement("div");
            item.className = "vf-select-option";
            item.id = `vfSelectOption${i}`;
            item.setAttribute("role", "option");
            item.dataset.index = String(option.index);
            item.textContent = textoOpcao(option);
            if (option.dataset.removivel !== undefined) {
                const apagar = document.createElement("button");
                apagar.type = "button";
                apagar.className = "vf-select-option-remove";
                apagar.tabIndex = -1;
                apagar.setAttribute("aria-label", `Apagar ${textoOpcao(option)}`);
                apagar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5"/></svg>';
                item.appendChild(apagar);
            }
            const selecionada = option.index === select.selectedIndex && !option.disabled;
            item.setAttribute("aria-selected", String(selecionada));
            if (option.disabled) item.setAttribute("aria-disabled", "true");
            lista.appendChild(item);
        });

        document.body.appendChild(lista);
        menuAberto = { select, botao, lista, ativo: -1 };
        botao.setAttribute("aria-expanded", "true");
        select.classList.add("vf-select-open");
        posicionar();

        const inicial = lista.querySelector('[aria-selected="true"]') || lista.querySelector('.vf-select-option:not([aria-disabled])');
        marcarAtivo(inicial);
        lista.focus({ preventScroll: true });
        inicial?.scrollIntoView({ block: "nearest" });

        lista.addEventListener("click", event => {
            const item = event.target.closest(".vf-select-option");
            if (item && event.target.closest(".vf-select-option-remove")) {
                const valor = select.options[Number(item.dataset.index)].value;
                fecharMenu(true);
                select.dispatchEvent(new CustomEvent("vf-option-remove", { bubbles: true, detail: valor }));
                return;
            }
            if (item && !item.hasAttribute("aria-disabled")) escolher(item);
        });
        lista.addEventListener("pointermove", event => {
            const item = event.target.closest(".vf-select-option");
            if (item && !item.hasAttribute("aria-disabled")) marcarAtivo(item);
        });
        lista.addEventListener("keydown", tecladoMenu);
    }

    function posicionar() {
        if (!menuAberto) return;
        const { select, lista } = menuAberto;
        const r = select.getBoundingClientRect();
        const margem = 8;
        const abaixo = window.innerHeight - r.bottom - margem;
        const acima = r.top - margem;
        const altura = Math.min(lista.scrollHeight, 300);
        const paraCima = abaixo < Math.min(altura, 200) && acima > abaixo;
        const largura = Math.max(r.width, 180);
        lista.style.minWidth = `${largura}px`;
        lista.style.maxWidth = `${Math.max(largura, Math.min(320, window.innerWidth - margem * 2))}px`;
        lista.style.maxHeight = `${Math.max(120, Math.min(300, paraCima ? acima - 6 : abaixo - 6))}px`;
        const esquerda = Math.min(Math.max(margem, r.left), window.innerWidth - lista.offsetWidth - margem);
        lista.style.left = `${esquerda}px`;
        lista.style.top = paraCima ? "" : `${r.bottom + 6}px`;
        lista.style.bottom = paraCima ? `${window.innerHeight - r.top + 6}px` : "";
        lista.classList.toggle("is-up", paraCima);
    }

    function itensAtivaveis() {
        return [...menuAberto.lista.querySelectorAll(".vf-select-option:not([aria-disabled])")];
    }

    function marcarAtivo(item) {
        if (!menuAberto) return;
        menuAberto.lista.querySelectorAll(".vf-select-option.is-active").forEach(el => el.classList.remove("is-active"));
        if (!item) return;
        item.classList.add("is-active");
        menuAberto.lista.setAttribute("aria-activedescendant", item.id);
        item.scrollIntoView({ block: "nearest" });
    }

    function tecladoMenu(event) {
        // O menu consome as suas teclas: Escape não deve fechar também o modal por trás.
        if (event.key !== "Tab") event.stopPropagation();
        const itens = itensAtivaveis();
        const atual = menuAberto.lista.querySelector(".vf-select-option.is-active");
        const pos = itens.indexOf(atual);
        if (event.key === "ArrowDown") { event.preventDefault(); marcarAtivo(itens[Math.min(itens.length - 1, pos + 1)]); }
        else if (event.key === "ArrowUp") { event.preventDefault(); marcarAtivo(itens[Math.max(0, pos - 1)]); }
        else if (event.key === "Home") { event.preventDefault(); marcarAtivo(itens[0]); }
        else if (event.key === "End") { event.preventDefault(); marcarAtivo(itens[itens.length - 1]); }
        else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (atual) escolher(atual); }
        else if (event.key === "Escape") { event.preventDefault(); fecharMenu(true); }
        else if (event.key === "Tab") { fecharMenu(true); }
        else if (event.key.length === 1) {
            // Escrever uma letra salta para a opção seguinte que começa por ela.
            const letra = event.key.toLocaleLowerCase("pt-PT");
            const ordem = [...itens.slice(pos + 1), ...itens.slice(0, pos + 1)];
            marcarAtivo(ordem.find(el => el.textContent.trim().toLocaleLowerCase("pt-PT").startsWith(letra)));
        }
    }

    function escolher(item) {
        const { select } = menuAberto;
        const indice = Number(item.dataset.index);
        const mudou = select.selectedIndex !== indice;
        select.selectedIndex = indice;
        fecharMenu(true);
        if (mudou) {
            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }

    function fecharMenu(devolverFoco) {
        if (!menuAberto) return;
        const { select, botao, lista } = menuAberto;
        menuAberto = null;
        lista.remove();
        botao.setAttribute("aria-expanded", "false");
        select.classList.remove("vf-select-open");
        if (devolverFoco && botao.isConnected) botao.focus({ preventScroll: true });
    }

    document.addEventListener("pointerdown", event => {
        if (!menuAberto) return;
        if (menuAberto.lista.contains(event.target) || menuAberto.botao.contains(event.target)) return;
        fecharMenu(false);
    }, true);
    window.addEventListener("resize", () => fecharMenu(false));
    document.addEventListener("scroll", event => {
        if (menuAberto && !menuAberto.lista.contains(event.target)) posicionar();
    }, true);

    function melhorarTodos(raiz = document) {
        raiz.querySelectorAll?.("select").forEach(melhorar);
        if (menuAberto && !menuAberto.select.isConnected) fecharMenu(false);
    }

    // As <select> são criadas dinamicamente pelos vários ecrãs.
    new MutationObserver(registos => {
        for (const r of registos) {
            for (const no of r.addedNodes) {
                if (no.nodeType !== 1) continue;
                if (no.tagName === "SELECT") melhorar(no);
                else if (no.querySelector?.("select")) melhorarTodos(no);
            }
        }
        if (menuAberto && !menuAberto.select.isConnected) fecharMenu(false);
    }).observe(document.documentElement, { childList: true, subtree: true });

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => melhorarTodos(), { once: true });
    else melhorarTodos();
})();
