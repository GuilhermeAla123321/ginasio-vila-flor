let timerSeconds = 0;

let timerTotal = 0;

let timerInterval = null;

let timerRunning = false;

let timerDeadline = 0;

let timerCompletionHandled = false;

let timerCompletionVisible = false;

let timerCompletionDeadline = 0;

let timerAudioContext = null;

let timerToneSequenceId = 0;

let activeToneAudio = null;

const activeToneNodes = new Set();

const TIMER_ITEM_HEIGHT = 44;

const TIMER_RING_CIRCUMFERENCE = 628.3;

const TIMER_COMPLETION_DURATION = 3000;

const TIMER_TONE_PATTERNS = {
    // Um único toque de conclusão, com alternativa local para redes bloqueadas.
    suave: [
        { frequency: 587.33, offset: 0.05, duration: 0.78, gain: 0.042 },
        { frequency: 739.99, offset: 0.48, duration: 0.88, gain: 0.036 },
        { frequency: 659.25, offset: 1.48, duration: 0.84, gain: 0.034 },
        { frequency: 523.25, offset: 2.17, duration: 0.72, gain: 0.029 }
    ]
};

const TIMER_AUDIO_FILES = {
    suave: { id: "timerToneAudioSuave", sourceDuration: 2.8 }
};


function formatTime(totalSeconds) {

    const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));

    return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;

}

function timerWheelItemHeight(wheel) {

    if (!wheel) return TIMER_ITEM_HEIGHT;

    const option = wheel.querySelector(".timer-wheel-option");

    const measured = option

        ? (option.getBoundingClientRect?.().height || option.offsetHeight || 0)

        : 0;

    if (measured > 0) return measured;

    const computed = window.getComputedStyle ? window.getComputedStyle(wheel) : null;

    const fromVariable = Number.parseFloat(computed?.getPropertyValue("--wheel-row-height"));

    return fromVariable > 0 ? fromVariable : TIMER_ITEM_HEIGHT;

}

function timerWheelValue(wheel) {

    if (!wheel) return 0;

    const max = Math.max(0, Number(wheel.dataset.max) || 0);

    const rowHeight = timerWheelItemHeight(wheel);

    return Math.max(0, Math.min(max, Math.round(wheel.scrollTop / rowHeight)));

}

/*

 * A roda usa a altura real da opção e centra dinamicamente a primeira/última

 * linha. Assim, os paddings responsivos deixam de depender de valores fixos

 * que possam divergir do tamanho efetivo da roda.

 */

function synchronizeTimerWheelGeometry(wheel, preserveSelection = true) {

    if (!wheel) return;

    const currentValue = preserveSelection ? timerWheelValue(wheel) : 0;

    const rowHeight = timerWheelItemHeight(wheel);

    const computed = window.getComputedStyle ? window.getComputedStyle(wheel) : null;

    const cssHeight = Number.parseFloat(computed?.height) || 0;

    const viewportHeight = wheel.clientHeight || cssHeight || 176;

    const inset = Math.max(0, (viewportHeight - rowHeight) / 2);

    wheel.style.setProperty("--wheel-row-height", `${rowHeight}px`);

    wheel.style.paddingTop = `${inset}px`;

    wheel.style.paddingBottom = `${inset}px`;

    wheel.style.scrollPaddingTop = `${inset}px`;

    wheel.style.scrollPaddingBottom = `${inset}px`;

    wheel.scrollTop = currentValue * rowHeight;

    updateWheelSelection(wheel);

}

function setWheelValue(wheel, value) {

    if (!wheel) return;

    const max = Math.max(0, Number(wheel.dataset.max) || 0);

    const safeValue = Math.max(0, Math.min(max, Number(value) || 0));

    wheel.scrollTop = safeValue * timerWheelItemHeight(wheel);

    updateWheelSelection(wheel);

}

function updateWheelSelection(wheel) {

    if (!wheel) return;

    const selected = timerWheelValue(wheel);

    wheel.querySelectorAll(".timer-wheel-option").forEach((option, index) => {

        const active = index === selected;

        option.classList.toggle("selected", active);

        option.setAttribute("aria-selected", active ? "true" : "false");

    });

}

function syncDurationFromWheels() {

    if (timerRunning) return;

    timerSeconds = selectedDuration();

    timerTotal = timerSeconds;

    updateTimer();

}

function createTimerWheel(wheel, max, unit) {

    if (!wheel) return;

    wheel.dataset.max = String(max);

    wheel.setAttribute("role", "listbox");

    wheel.setAttribute("aria-label", unit === "min" ? "Minutos" : "Segundos");

    wheel.innerHTML = "";

    const selection = document.createElement("div");

    selection.className = "timer-wheel-selection";

    selection.setAttribute("aria-hidden", "true");

    wheel.appendChild(selection);

    const options = document.createElement("div");

    options.className = "timer-wheel-options";

    for (let value = 0; value <= max; value++) {

        const option = document.createElement("div");

        option.className = "timer-wheel-option";

        option.dataset.value = String(value);

        option.setAttribute("role", "option");

        option.setAttribute("aria-selected", "false");

        const number = document.createElement("span");

        number.textContent = String(value);

        option.appendChild(number);

        if (value === 0) {

            const unitLabel = document.createElement("span");

            unitLabel.className = "timer-wheel-unit";

            unitLabel.textContent = unit;

            option.appendChild(unitLabel);

        }

        options.appendChild(option);

    }

    wheel.appendChild(options);

    wheel.addEventListener("scroll", () => {

        if (timerRunning) {

            // Abrange scroll do rato/trackpad, que não dispara pointerdown em todos os casos.

            stopTimerInterval();

            cancelTimerBackgroundNotification();

        }

        updateWheelSelection(wheel);

        syncDurationFromWheels();

    }, { passive: true });

    // Corrige qualquer diferença residual depois do snap/gesto, quando suportado.

    wheel.addEventListener("scrollend", () => {

        const value = timerWheelValue(wheel);

        setWheelValue(wheel, value);

        syncDurationFromWheels();

    });

    wheel.addEventListener("keydown", event => {

        let next = timerWheelValue(wheel);

        if (event.key === "ArrowUp") next--;

        else if (event.key === "ArrowDown") next++;

        else if (event.key === "Home") next = 0;

        else if (event.key === "End") next = max;

        else return;

        event.preventDefault();

        if (timerRunning) {

            stopTimerInterval();

            cancelTimerBackgroundNotification();

        }

        setWheelValue(wheel, next);

        syncDurationFromWheels();

    });

    synchronizeTimerWheelGeometry(wheel, false);

    setWheelValue(wheel, 0);

}

function selectedDuration() {

    const minutes = timerWheelValue(document.getElementById("timerMinutesWheel"));

    const seconds = timerWheelValue(document.getElementById("timerSecondsWheel"));

    return minutes * 60 + seconds;

}

function updateTimerRing() {

    const ring = document.getElementById("timerRingProgress");

    if (!ring) return;

    const progress = timerTotal > 0 ? Math.max(0, Math.min(1, timerSeconds / timerTotal)) : 0;

    ring.style.strokeDasharray = String(TIMER_RING_CIRCUMFERENCE);

    ring.style.strokeDashoffset = String(TIMER_RING_CIRCUMFERENCE * (1 - progress));

}

function updateTimer() {

    const display = document.getElementById("timerDisplay");

    const formattedTime = formatTime(timerSeconds);

    if (display && display.textContent !== formattedTime) display.textContent = formattedTime;

    updateTimerRing();

    const card = document.getElementById("timerCard");

    const state = document.getElementById("timerState");

    const startButton = document.getElementById("timerStart");

    if (card) {

        card.classList.toggle("is-ending", timerRunning && timerSeconds > 0 && timerSeconds <= 10);

        card.classList.toggle("is-running", timerRunning);

        card.classList.toggle("is-finished", !timerRunning && timerSeconds === 0 && timerTotal > 0);

    }

    // Mantém o estado acessível, sem mostrar uma mensagem redundante enquanto está parado.

    const stateText = timerRunning ? "Em curso" : (timerSeconds === 0 && timerTotal > 0 ? "Concluído" : "");

    if (state && state.textContent !== stateText) state.textContent = stateText;

    if (startButton) {

        const buttonText = timerRunning ? "Parar" : "Iniciar";

        const buttonLabel = timerRunning ? "Parar temporizador" : "Iniciar temporizador";

        if (startButton.textContent !== buttonText) startButton.textContent = buttonText;

        if (startButton.getAttribute("aria-label") !== buttonLabel) startButton.setAttribute("aria-label", buttonLabel);

    }

}

function ensureTimerTicker() {

    if (timerInterval === null) timerInterval = setInterval(tickTimer, 100);

}

function maybeStopTimerTicker() {

    if (timerRunning || timerCompletionVisible || timerInterval === null) return;

    clearInterval(timerInterval);

    timerInterval = null;

}

function cancelTimerBackgroundNotification() {

    const alerts = window.TimerBackgroundAlerts;

    if (!alerts || typeof alerts.cancel !== "function") return;

    try {

        const result = alerts.cancel();

        if (result && typeof result.catch === "function") result.catch(() => {});

    } catch (_) {

        // A falha do alerta remoto nunca deve interromper o temporizador local.

    }

}

function scheduleTimerBackgroundNotification() {

    const alerts = window.TimerBackgroundAlerts;

    if (!alerts || typeof alerts.schedule !== "function") return;

    try {

        const result = alerts.schedule(timerDeadline);

        if (result && typeof result.catch === "function") result.catch(() => {});

    } catch (_) {

        // O temporizador local continua a funcionar se o serviço estiver indisponível.

    }

}

function stopTimerInterval() {

    timerRunning = false;

    timerDeadline = 0;

    maybeStopTimerTicker();

}

function tickTimer() {

    if (timerRunning) {

        const remainingMs = timerDeadline - Date.now();

        timerSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

        updateTimer();

        if (remainingMs <= 0 && !timerCompletionHandled) completeTimer();

    }

    if (timerCompletionVisible) updateTimerCompletionPopup();

    maybeStopTimerTicker();

}

function completeTimer() {

    if (timerCompletionHandled) return;

    timerCompletionHandled = true;

    timerRunning = false;

    timerDeadline = 0;

    timerSeconds = 0;

    updateTimer();

    // Mantém a vibração existente nos dispositivos que a suportam.

    try {

        if (navigator.vibrate) navigator.vibrate([120, 80, 120]);

    } catch (_) {

        // A vibração é opcional; o aviso visual continua a funcionar.

    }

    showTimerCompletionPopup();

    if (document.visibilityState === "hidden") {

        // O serviço remoto trata do alerta do sistema; não tentamos áudio personalizado

        // numa página suspensa, onde os navegadores podem bloquear a reprodução.

    } else {

        // Em primeiro plano, preferimos o toque personalizado local e cancelamos

        // a notificação remota para reduzir a possibilidade de alertas duplicados.

        cancelTimerBackgroundNotification();

        playTimerTone("suave");

    }

}

function resetTimer() {

    stopTimerInterval();

    cancelTimerBackgroundNotification();

    dismissTimerCompletionPopup();

    cancelCurrentToneSequence();

    timerCompletionHandled = false;

    timerSeconds = selectedDuration();

    timerTotal = timerSeconds;

    updateTimer();

}

function showTimerCompletionPopup() {

    const popup = document.getElementById("timerCompletionPopup");

    if (!popup) return;

    timerCompletionVisible = true;

    timerCompletionDeadline = Date.now() + TIMER_COMPLETION_DURATION;

    popup.hidden = false;

    popup.style.setProperty("--timer-completion-progress", "1");

    const countdown = document.getElementById("timerCompletionCountdown");

    if (countdown) countdown.textContent = "3";

    ensureTimerTicker();

    updateTimerCompletionPopup();

}

function updateTimerCompletionPopup() {

    if (!timerCompletionVisible) return;

    const remainingMs = timerCompletionDeadline - Date.now();

    if (remainingMs <= 0) {

        dismissTimerCompletionPopup();

        return;

    }

    const secondsRemaining = Math.max(1, Math.ceil(remainingMs / 1000));

    const countdown = document.getElementById("timerCompletionCountdown");

    const popup = document.getElementById("timerCompletionPopup");

    const progress = document.getElementById("timerCompletionProgress");

    if (countdown && countdown.textContent !== String(secondsRemaining)) {

        countdown.textContent = String(secondsRemaining);

    }

    if (progress) {

        progress.style.transform = `scaleX(${Math.max(0, Math.min(1, remainingMs / TIMER_COMPLETION_DURATION))})`;

    }

}

function dismissTimerCompletionPopup() {

    timerCompletionVisible = false;

    timerCompletionDeadline = 0;

    const popup = document.getElementById("timerCompletionPopup");

    if (popup) popup.hidden = true;

    maybeStopTimerTicker();

}

function getTimerAudioContext() {

    if (timerAudioContext) return timerAudioContext;

    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextConstructor) return null;

    try {

        timerAudioContext = new AudioContextConstructor();

    } catch (_) {

        timerAudioContext = null;

    }

    return timerAudioContext;

}

function cancelCurrentToneSequence() {

    timerToneSequenceId += 1;

    // Interrompe a faixa ativa e limpa os handlers para não acumular listeners.

    if (activeToneAudio) {

        const audio = activeToneAudio;

        activeToneAudio = null;

        try {

            audio.pause();

            audio.currentTime = 0;

            audio.onended = null;

            audio.onerror = null;

            audio.onloadedmetadata = null;

        } catch (_) {

            // O elemento pode ainda não ter metadados ou já estar parado.

        }

    }

    const context = timerAudioContext;

    const now = context ? context.currentTime : 0;

    for (const node of Array.from(activeToneNodes)) {

        try {

            node.gain.gain.cancelScheduledValues(now);

            node.gain.gain.setValueAtTime(Math.max(Number(node.gain.gain.value) || 0.0001, 0.0001), now);

            node.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

            node.oscillator.stop(now + 0.02);

        } catch (_) {

            // O oscilador pode já ter terminado.

        }

    }

    activeToneNodes.clear();

    return timerToneSequenceId;

}

function prepareTimerAudioFromGesture() {

    const context = getTimerAudioContext();

    if (!context || context.state !== "suspended") return;

    try {

        const result = context.resume();

        if (result && typeof result.catch === "function") result.catch(() => {});

    } catch (_) {

        // O aviso visual não depende da reprodução sonora.

    }

}

function playSynthesizedTimerTone(toneName, sequenceId) {

    const pattern = TIMER_TONE_PATTERNS[toneName] || TIMER_TONE_PATTERNS.suave;

    const context = getTimerAudioContext();

    if (!context || context.state === "closed") return false;

    const schedule = () => {

        if (sequenceId !== timerToneSequenceId || context.state === "closed") return;

        const startAt = context.currentTime + 0.025;

        for (const note of pattern) {

            try {

                const oscillator = context.createOscillator();

                const gain = context.createGain();

                const noteStart = startAt + note.offset;

                const noteEnd = Math.min(startAt + 2.98, noteStart + note.duration);

                const peak = Math.max(0.001, note.gain);

                oscillator.type = "sine";

                oscillator.frequency.setValueAtTime(note.frequency, noteStart);

                gain.gain.setValueAtTime(0.0001, noteStart);

                gain.gain.exponentialRampToValueAtTime(peak, noteStart + Math.min(0.045, note.duration * 0.16));

                gain.gain.setValueAtTime(peak, Math.max(noteStart + 0.05, noteEnd - Math.min(0.09, note.duration * 0.2)));

                gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

                oscillator.connect(gain);

                gain.connect(context.destination);

                const node = { oscillator, gain };

                activeToneNodes.add(node);

                oscillator.onended = () => activeToneNodes.delete(node);

                oscillator.start(noteStart);

                oscillator.stop(noteEnd + 0.025);

            } catch (_) {

                // Se a API de áudio falhar, o aviso visual mantém-se.

            }

        }

    };

    try {

        if (context.state === "suspended") {

            context.resume().then(schedule).catch(() => {});

        } else {

            schedule();

        }

        return true;

    } catch (_) {

        return false;

    }

}

function playTimerTone(toneName, onStarted, onUnavailable) {

    const tone = Object.prototype.hasOwnProperty.call(TIMER_AUDIO_FILES, toneName)

        ? toneName

        : "suave";

    const config = TIMER_AUDIO_FILES[tone];

    const sequenceId = cancelCurrentToneSequence();

    const audio = document.getElementById(config.id);

    let fallbackTriggered = false;

    const useFallback = () => {

        if (fallbackTriggered || sequenceId !== timerToneSequenceId) return;

        fallbackTriggered = true;

        if (activeToneAudio === audio) activeToneAudio = null;

        if (audio) {

            try {

                audio.pause();

                audio.currentTime = 0;

                audio.onended = null;

                audio.onerror = null;

                audio.onloadedmetadata = null;

            } catch (_) {}

        }

        const started = playSynthesizedTimerTone(tone, sequenceId);

        if (started && typeof onStarted === "function") onStarted();

        else if (!started && typeof onUnavailable === "function") onUnavailable();

    };

    if (!audio) {

        useFallback();

        return true;

    }

    try {

        audio.pause();

        audio.currentTime = 0;

        audio.volume = 0.66;

        audio.preservesPitch = true;

        audio.webkitPreservesPitch = true;

        audio.mozPreservesPitch = true;

        audio.playbackRate = config.sourceDuration / (TIMER_COMPLETION_DURATION / 1000);

        activeToneAudio = audio;

        const syncActualDuration = () => {

            if (sequenceId !== timerToneSequenceId || fallbackTriggered || activeToneAudio !== audio) return;

            const actualDuration = Number(audio.duration);

            if (Number.isFinite(actualDuration) && actualDuration > 0) {

                audio.playbackRate = Math.max(0.5, Math.min(1.5, actualDuration / (TIMER_COMPLETION_DURATION / 1000)));

            }

        };

        // Usar propriedades de evento evita acumular handlers após muitas mudanças de opção.

        audio.onloadedmetadata = syncActualDuration;

        audio.onended = () => {

            if (sequenceId !== timerToneSequenceId) return;

            if (activeToneAudio === audio) activeToneAudio = null;

        };

        audio.onerror = useFallback;

        syncActualDuration();

        const result = audio.play();

        if (result && typeof result.then === "function") {

            result.then(() => {

                if (sequenceId !== timerToneSequenceId) {

                    audio.pause();

                    return;

                }

                if (!fallbackTriggered && typeof onStarted === "function") onStarted();

            }).catch(useFallback);

        } else if (typeof onStarted === "function") {

            onStarted();

        }

        return true;

    } catch (_) {

        useFallback();

        return true;

    }

}

function previewTimerTone() {
    // O gesto do utilizador prepara o Web Audio antes da pré-visualização.
    prepareTimerAudioFromGesture();
    playTimerTone("suave");
}


document.addEventListener("DOMContentLoaded", () => {

    const minutesWheel = document.getElementById("timerMinutesWheel");

    const secondsWheel = document.getElementById("timerSecondsWheel");

    createTimerWheel(minutesWheel, 59, "min");

    createTimerWheel(secondsWheel, 59, "s");

    [minutesWheel, secondsWheel].forEach(wheel => {

        if (!wheel) return;

        wheel.addEventListener("pointerdown", () => {

            if (timerRunning) {

                stopTimerInterval();

                cancelTimerBackgroundNotification();

                updateTimer();

            }

        }, { passive: true });

    });

    // Recalcula o centramento quando a página Timer fica visível ou o ecrã muda.

    if (typeof ResizeObserver !== "undefined") {

        const wheelResizeObserver = new ResizeObserver(entries => {

            entries.forEach(entry => synchronizeTimerWheelGeometry(entry.target, true));

        });

        [minutesWheel, secondsWheel].forEach(wheel => {

            if (wheel) wheelResizeObserver.observe(wheel);

        });

    }

    window.addEventListener("resize", () => {

        synchronizeTimerWheelGeometry(minutesWheel, true);

        synchronizeTimerWheelGeometry(secondsWheel, true);

    }, { passive: true });

    const tonePreview = document.querySelector(".timer-tone-preview");

    if (tonePreview) tonePreview.addEventListener("click", previewTimerTone);

    const startButton = document.getElementById("timerStart");

    const resetButton = document.getElementById("timerReset");

    const dismissButton = document.getElementById("timerCompletionDismiss");

    if (startButton) {

        startButton.addEventListener("click", () => {

            if (timerRunning) {

                stopTimerInterval();

                cancelTimerBackgroundNotification();

                updateTimer();

                return;

            }

            dismissTimerCompletionPopup();

            cancelTimerBackgroundNotification();

            cancelCurrentToneSequence();

            timerSeconds = selectedDuration();

            timerTotal = timerSeconds;

            if (timerSeconds <= 0) {

                const card = document.getElementById("timerCard");

                if (card) {

                    card.classList.remove("timer-nudge");

                    void card.offsetWidth;

                    card.classList.add("timer-nudge");

                    setTimeout(() => card.classList.remove("timer-nudge"), 300);

                }

                updateTimer();

                return;

            }

            prepareTimerAudioFromGesture();

            timerCompletionHandled = false;

            timerDeadline = Date.now() + timerSeconds * 1000;

            timerRunning = true;

            updateTimer();

            ensureTimerTicker();

            scheduleTimerBackgroundNotification();

        });

    }

    if (resetButton) resetButton.addEventListener("click", resetTimer);

    if (dismissButton) dismissButton.addEventListener("click", dismissTimerCompletionPopup);

    // Se o navegador suspender a página, o tempo restante continua baseado no relógio real.

    document.addEventListener("visibilitychange", () => {

        if (!document.hidden) {

            tickTimer();

            if (timerCompletionHandled) cancelTimerBackgroundNotification();

        }

    });

    timerSeconds = 0;

    timerTotal = 0;

    updateTimer();

});
