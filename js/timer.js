let timerSeconds = 0;
let timerTotal = 0;
let timerInterval = null;
let timerRunning = false;
const TIMER_ITEM_HEIGHT = 44;
const TIMER_RING_CIRCUMFERENCE = 628.3;

function formatTime(totalSeconds) {
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function timerWheelValue(wheel) {
    if (!wheel) return 0;
    return Math.max(0, Math.min(Number(wheel.dataset.max) || 0,
        Math.round(wheel.scrollTop / TIMER_ITEM_HEIGHT)));
}

function setWheelValue(wheel, value) {
    if (!wheel) return;
    const safeValue = Math.max(0, Math.min(Number(wheel.dataset.max) || 0, Number(value) || 0));
    wheel.scrollTop = safeValue * TIMER_ITEM_HEIGHT;
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
        option.innerHTML = `<span>${value}</span>${value === 0 ? `<span class="timer-wheel-unit">${unit}</span>` : ""}`;
        options.appendChild(option);
    }
    wheel.appendChild(options);

    wheel.addEventListener("scroll", () => {
        updateWheelSelection(wheel);
        if (!timerRunning) {
            timerSeconds = selectedDuration();
            timerTotal = timerSeconds;
            updateTimer();
        }
    }, { passive: true });

    wheel.addEventListener("keydown", event => {
        let next = timerWheelValue(wheel);
        if (event.key === "ArrowUp") next--;
        else if (event.key === "ArrowDown") next++;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = max;
        else return;
        event.preventDefault();
        setWheelValue(wheel, next);
        if (!timerRunning) {
            timerSeconds = selectedDuration();
            timerTotal = timerSeconds;
            updateTimer();
        }
    });
    setWheelValue(wheel, 0);
}

function selectedDuration() {
    const minutes = timerWheelValue(document.getElementById("timerMinutesWheel"));
    const seconds = timerWheelValue(document.getElementById("timerSecondsWheel"));
    return minutes * 60 + seconds;
}

function updateTimer() {
    const display = document.getElementById("timerDisplay");
    if (display) display.textContent = formatTime(timerSeconds);
    const ring = document.getElementById("timerRingProgress");
    if (ring) {
        const progress = timerTotal > 0 ? Math.max(0, Math.min(1, timerSeconds / timerTotal)) : 0;
        ring.style.strokeDasharray = String(TIMER_RING_CIRCUMFERENCE);
        ring.style.strokeDashoffset = String(TIMER_RING_CIRCUMFERENCE * (1 - progress));
    }
    const card = document.getElementById("timerCard");
    const state = document.getElementById("timerState");
    const startButton = document.getElementById("timerStart");
    if (card) {
        card.classList.toggle("is-ending", timerRunning && timerSeconds > 0 && timerSeconds <= 10);
        card.classList.toggle("is-running", timerRunning);
        card.classList.toggle("is-finished", !timerRunning && timerSeconds === 0 && timerTotal > 0);
    }
    if (state) state.textContent = timerRunning ? "Em curso" : (timerSeconds === 0 && timerTotal > 0 ? "Concluído" : "Pronto");
    if (startButton) {
        startButton.textContent = timerRunning ? "Parar" : "Iniciar";
        startButton.setAttribute("aria-label", timerRunning ? "Parar temporizador" : "Iniciar temporizador");
    }
}

function stopTimerInterval() {
    if (timerInterval !== null) clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
}

function resetTimer() {
    stopTimerInterval();
    timerSeconds = selectedDuration();
    timerTotal = timerSeconds;
    updateTimer();
}

document.addEventListener("DOMContentLoaded", () => {
    const minutesWheel = document.getElementById("timerMinutesWheel");
    const secondsWheel = document.getElementById("timerSecondsWheel");
    createTimerWheel(minutesWheel, 99, "min");
    createTimerWheel(secondsWheel, 59, "s");

    [minutesWheel, secondsWheel].forEach(wheel => {
        if (!wheel) return;
        wheel.addEventListener("pointerdown", () => {
            if (timerRunning) {
                stopTimerInterval();
                updateTimer();
            }
        }, { passive: true });
    });

    const startButton = document.getElementById("timerStart");
    const resetButton = document.getElementById("timerReset");
    if (startButton) {
        startButton.addEventListener("click", () => {
            if (timerRunning) {
                stopTimerInterval();
                updateTimer();
                return;
            }
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
                return;
            }
            timerRunning = true;
            updateTimer();
            timerInterval = setInterval(() => {
                timerSeconds = Math.max(0, timerSeconds - 1);
                updateTimer();
                if (timerSeconds <= 0) {
                    stopTimerInterval();
                    updateTimer();
                    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
                }
            }, 1000);
        });
    }
    if (resetButton) resetButton.addEventListener("click", resetTimer);
    timerSeconds = 0;
    timerTotal = 0;
    updateTimer();
});
