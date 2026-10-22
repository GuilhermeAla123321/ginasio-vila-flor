/* Estado e navegação do cartão de horário da página inicial. */
(() => {
    const dias = [
        "domingo", "segunda-feira", "terça-feira", "quarta-feira",
        "quinta-feira", "sexta-feira", "sábado"
    ];

    function lerHorarioDoDia(dia) {
        const rows = Array.from(document.querySelectorAll("#infoHoursCard .info-hours-row[data-weekdays]"));
        const row = rows.find(item => (item.dataset.weekdays || "").split(",").includes(String(dia)));
        // Lê os períodos diretamente do horário visível em Informação, evitando duplicar horas.
        const textoHorario = row?.querySelector(".info-hours-time")?.textContent || "";
        const periodos = Array.from(textoHorario.matchAll(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/g))
            .map(([_, inicio, fim]) => ({ inicio, fim }));
        return { periodos, row };
    }

    function minutos(hora) {
        const [h, m] = hora.split(":").map(Number);
        return h * 60 + m;
    }

    function atualizarEstadoHorario() {
        const cartao = document.getElementById("gymHoursStatus");
        const estado = document.getElementById("gymHoursStatusLabel");
        const resumo = document.getElementById("gymHoursStatusSummary");
        if (!cartao || !estado || !resumo) return;

        const agora = new Date();
        const dia = agora.getDay();
        const horaAtual = agora.getHours() * 60 + agora.getMinutes();
        const { periodos, row } = lerHorarioDoDia(dia);
        const aberto = periodos.some(({ inicio, fim }) => horaAtual >= minutos(inicio) && horaAtual < minutos(fim));
        const formatoPeriodos = periodos.map(({ inicio, fim }) => `${inicio}–${fim}`).join(" · ");
        const hoje = dias[dia];

        estado.textContent = aberto ? "Aberto agora" : "Fechado agora";
        resumo.textContent = formatoPeriodos
            ? `Hoje (${hoje}): ${formatoPeriodos}`
            : `Hoje (${hoje}): ${row?.querySelector(".info-hours-status")?.textContent?.trim() || "Encerrado"}`;
        cartao.classList.toggle("is-open", aberto);
        cartao.classList.toggle("is-closed", !aberto);
        cartao.setAttribute("aria-label", `${estado.textContent}. ${resumo.textContent}. Consultar informação e horários.`);
    }

    function abrirInformacaoHorario() {
        if (typeof window.mostrarPagina === "function") {
            window.mostrarPagina("info");
        } else {
            document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
            document.getElementById("page-info")?.classList.add("active");
        }

        const detalhesHorario = document.getElementById("infoHoursCard");
        if (detalhesHorario) detalhesHorario.open = true;
        window.requestAnimationFrame(() => detalhesHorario?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }

    document.addEventListener("DOMContentLoaded", () => {
        atualizarEstadoHorario();
        document.getElementById("gymHoursStatus")?.addEventListener("click", abrirInformacaoHorario);
        // Atualiza o estado ao longo do dia, incluindo quando o ginásio abre/fecha.
        window.setInterval(atualizarEstadoHorario, 60_000);
    });
})();
