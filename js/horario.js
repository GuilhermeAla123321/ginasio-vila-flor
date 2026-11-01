/* Estado e navegação do cartão de horário da página inicial. */
(() => {

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

    // Minutos até à próxima abertura, procurando em toda a semana seguinte.
    function minutosAteAbrir(horaAtual, dia, periodosDoDia) {
        for (let adiante = 0; adiante <= 7; adiante += 1) {
            const inicios = periodosDoDia((dia + adiante) % 7).map(({ inicio }) => minutos(inicio)).sort((a, b) => a - b);
            const proximo = inicios.find(inicio => adiante > 0 || inicio > horaAtual);
            if (proximo !== undefined) return adiante * 1440 + proximo - horaAtual;
        }
        return null;
    }

    function formatarEspera(total) {
        if (total < 60) return `${total} min`;
        if (total < 1440) return `${Math.floor(total / 60)} h${total % 60 ? ` ${total % 60} min` : ""}`;
        const dias = Math.floor(total / 1440), horas = Math.floor((total % 1440) / 60);
        return `${dias} ${dias === 1 ? "dia" : "dias"}${horas ? ` e ${horas} h` : ""}`;
    }

    // Feriados nacionais (fixos e móveis). O horário real nesses dias não está na app.
    function eFeriadoNacional(data) {
        const ano = data.getFullYear();
        const fixos = ["1-1", "4-25", "5-1", "6-10", "8-15", "10-5", "11-1", "12-1", "12-8", "12-25"];
        if (fixos.includes(`${data.getMonth() + 1}-${data.getDate()}`)) return true;
        // Algoritmo de Meeus para o domingo de Páscoa.
        const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
        const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((8 * b + 13) / 25) + 1) / 3) + 15) % 30;
        const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
        const moveis = [-2, 60].map(dias => new Date(ano, mes - 1, dia + dias).getTime()); // Sexta-feira Santa e Corpo de Deus
        return moveis.includes(new Date(ano, data.getMonth(), data.getDate()).getTime());
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
        const feriado = periodos.length > 0 && eFeriadoNacional(agora);
        const aberto = !feriado && periodos.some(({ inicio, fim }) => horaAtual >= minutos(inicio) && horaAtual < minutos(fim));
        const formatoPeriodos = periodos.map(({ inicio, fim }) => `${inicio}–${fim}`).join(" · ");

        // Num dia sem horário, «Fechado hoje» já diz tudo.
        estado.textContent = feriado ? "Feriado hoje" : aberto ? "Aberto agora" : formatoPeriodos ? "Fechado agora" : "Fechado hoje";
        const espera = aberto || feriado ? null : minutosAteAbrir(horaAtual, dia, d => lerHorarioDoDia(d).periodos);
        resumo.textContent = feriado
            ? "Confirma o horário"
            : aberto
            ? `Hoje: ${formatoPeriodos}`
            : espera === null ? "" : `Abre em ${formatarEspera(espera)}`;
        cartao.classList.toggle("is-open", aberto);
        cartao.classList.toggle("is-closed", !aberto);
        cartao.setAttribute("aria-label", `${estado.textContent}. ${resumo.textContent ? `${resumo.textContent}. ` : ""}Consultar informação e horários.`);
    }

    function abrirInformacaoHorario() {
        mostrarPagina("info");

        const detalhesHorario = document.getElementById("infoHoursCard");
        if (detalhesHorario) detalhesHorario.open = true;
        window.requestAnimationFrame(() => detalhesHorario?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }

    document.addEventListener("DOMContentLoaded", () => {
        atualizarEstadoHorario();
        document.getElementById("gymHoursStatus")?.addEventListener("click", abrirInformacaoHorario);
        // Atualiza o estado ao longo do dia, incluindo quando o ginásio abre/fecha.
        window.setInterval(atualizarEstadoHorario, 60_000);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") atualizarEstadoHorario();
        });
    });
})();
