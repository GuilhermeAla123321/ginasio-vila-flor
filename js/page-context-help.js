/* Ajuda contextual: funciona também nos cabeçalhos criados dinamicamente. */
(() => {
    function closeAll(except = null) {
        document.querySelectorAll(".page-context-help").forEach(button => {
            if (button === except) return;
            button.setAttribute("aria-expanded", "false");
            const text = document.getElementById(button.getAttribute("aria-controls"));
            if (text) text.hidden = true;
        });
    }

    document.addEventListener("click", event => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) {
            closeAll();
            return;
        }

        // O modal de exercício personalizado já gere o seu próprio botão de ajuda.
        if (target.closest(".custom-exercise-help-button")) return;

        const button = target.closest(".page-context-help");
        if (button) {
            const text = document.getElementById(button.getAttribute("aria-controls"));
            if (!text) return;
            const wasOpen = button.getAttribute("aria-expanded") === "true";
            closeAll(button);
            button.setAttribute("aria-expanded", wasOpen ? "false" : "true");
            text.hidden = wasOpen;
            return;
        }

        if (target.closest(".page-context-help-text")) return;
        closeAll();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeAll();
    });
})();
