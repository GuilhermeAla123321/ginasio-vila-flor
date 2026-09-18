/* =========================================================
   CONFIGURAÇÃO E ARMAZENAMENTO
   ========================================================= */

const STORAGE_TREINOS = "vf_ginasio_treinos_v2";
const STORAGE_EXERCICIOS_PERSONALIZADOS =
    "vf_ginasio_exercicios_personalizados_v1";

const STORAGE_FAVORITOS_EXERCICIOS =
    "vf_ginasio_favoritos_exercicios_v1";


/* =========================================================
   DIAS DA SEMANA
   ========================================================= */

const diasSemana = [
    ["segunda", "SEG", "Segunda-feira"],
    ["terca", "TER", "Terça-feira"],
    ["quarta", "QUA", "Quarta-feira"],
    ["quinta", "QUI", "Quinta-feira"],
    ["sexta", "SEX", "Sexta-feira"],
    ["sabado", "SÁB", "Sábado"],
    ["domingo", "DOM", "Domingo"]
];


/* =========================================================
   BIBLIOTECA DE EXERCÍCIOS
   ========================================================= */

const exerciciosDisponiveis = [
    "Supino Plano",
    "Supino Inclinado",
    "Aberturas com Halteres",
    "Press de Peito",
    "Puxada Frontal",
    "Remada Sentada",
    "Remada com Halteres",
    "Elevação Lateral",
    "Press de Ombros",
    "Curl de Bíceps",
    "Curl Martelo",
    "Tríceps na Polia",
    "Agachamento",
    "Leg Press",
    "Extensão de Pernas",
    "Flexão de Pernas",
    "Peso Livre",
    "Máquina Abdutora",
    "Máquina Adutora",
    "Passadeira",
    "Bicicleta",
    "Elíptica",
    "Máquina de Remo"
];


/* =========================================================
   TIPOS DE EXERCÍCIO
   ========================================================= */

const TIPOS_EXERCICIO = {

    musculacao: {
        label: "Musculação",
        params: ["carga", "series", "repeticoes"]
    },

    halteres: {
        label: "Musculação · Halteres",
        params: ["pesoHalter", "series", "repeticoes"]
    },

    cardio: {
        label: "Cardio",
        params: [
            "resistencia",
            "velocidade",
            "tempo",
            "distancia",
            "series"
        ]
    },

    passadeira: {
        label: "Cardio · Passadeira",
        params: [
            "velocidade",
            "inclinacao",
            "tempo",
            "series"
        ]
    },

    remo: {
        label: "Cardio · Remo",
        params: [
            "resistencia",
            "tempo",
            "distancia",
            "ritmo",
            "series"
        ]
    },

    pesoCorporal: {
        label: "Peso corporal",
        params: [
            "series",
            "repeticoes",
            "tempo"
        ]
    },

    isometrico: {
        label: "Isométrico",
        params: [
            "tempo",
            "series"
        ]
    },

    mobilidade: {
        label: "Mobilidade/Flexibilidade",
        params: [
            "tempo",
            "series"
        ]
    },

    outro: {
        label: "Outro",
        params: [
            "carga",
            "series",
            "repeticoes",
            "tempo",
            "velocidade",
            "inclinacao",
            "distancia",
            "resistencia",
            "ritmo"
        ]
    }
};


/* =========================================================
   PARÂMETROS DOS EXERCÍCIOS
   ========================================================= */

const PARAMETROS = {

    carga: {
        label: "Carga",
        unit: "kg",
        step: "0.5",
        placeholder: ""
    },

    pesoHalter: {
        label: "Peso por halter",
        unit: "kg",
        step: "0.5",
        placeholder: ""
    },

    series: {
        label: "Séries",
        unit: "",
        step: "1",
        placeholder: ""
    },

    repeticoes: {
        label: "Repetições",
        unit: "",
        step: "1",
        placeholder: ""
    },

    tempo: {
        label: "Tempo",
        unit: "min",
        step: "0.5",
        placeholder: ""
    },

    velocidade: {
        label: "Velocidade",
        unit: "km/h",
        step: "0.1",
        placeholder: ""
    },

    inclinacao: {
        label: "Inclinação",
        unit: "%",
        step: "0.5",
        placeholder: ""
    },

    distancia: {
        label: "Distância",
        unit: "km",
        step: "0.01",
        placeholder: ""
    },

    resistencia: {
        label: "Resistência",
        unit: "",
        step: "1",
        placeholder: ""
    },

    ritmo: {
        label: "Ritmo",
        unit: "min/500m",
        step: "0.1",
        placeholder: ""
    }
};
/* =========================================================
   ESTADO DA APLICAÇÃO
   ========================================================= */

let treinos = carregarJSON(STORAGE_TREINOS, {});
let exerciciosPersonalizados =
    carregarJSON(STORAGE_EXERCICIOS_PERSONALIZADOS, []);
let favoritosExercicios =
    carregarJSON(STORAGE_FAVORITOS_EXERCICIOS, []);

if (!Array.isArray(favoritosExercicios)) {
    favoritosExercicios = [];
}

let filtroBiblioteca = "todos";
let valorFiltroBiblioteca = "Todos";
let favoritosApenas = false;

let diaSelecionado = "segunda";


/* =========================================================
   ARMAZENAMENTO / UTILITÁRIOS
   ========================================================= */

function carregarJSON(chave, valorPadrao) {

    try {
        const raw = localStorage.getItem(chave);

        if (!raw) {
            return valorPadrao;
        }

        return JSON.parse(raw) ?? valorPadrao;

    } catch (e) {

        console.warn(
            `Não foi possível ler ${chave}:`,
            e
        );

        return valorPadrao;
    }
}


function save() {

    try {

        localStorage.setItem(
            STORAGE_TREINOS,
            JSON.stringify(treinos)
        );

    } catch (e) {

        console.warn(
            "Treinos localStorage:",
            e
        );
    }
}


function saveExerciciosPersonalizados() {

    try {

        localStorage.setItem(
            STORAGE_EXERCICIOS_PERSONALIZADOS,
            JSON.stringify(exerciciosPersonalizados)
        );

    } catch (e) {

        console.warn(
            "Exercícios personalizados localStorage:",
            e
        );
    }
}


function treinoAtual() {

    if (!treinos[diaSelecionado]) {

        treinos[diaSelecionado] = {
            nome: "Treino",
            exercicios: []
        };
    }

    return treinos[diaSelecionado];
}


function normalizarTexto(valor) {

    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}


function escaparAtributo(s) {

    return escapeHtml(s).replace(
        /`/g,
        "&#96;"
    );
}


function escapeHtml(s) {

    return String(s ?? "").replace(
        /[&<>"']/g,
        m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        }[m])
    );
}


/* =========================================================
   INFERÊNCIA DE TIPO E GRUPO
   ========================================================= */

function inferirTipoExercicio(
    nome,
    grupo = ""
) {

    const n = normalizarTexto(nome);

    if (/passadeira|treadmill/.test(n)) {
        return "passadeira";
    }

    if (/bicicleta|bike|bicycle/.test(n)) {
        return "cardio";
    }

    if (/eliptica|elliptical/.test(n)) {
        return "cardio";
    }

    if (/remo|rowing|ergometro/.test(n)) {
        return "remo";
    }

    if (/prancha|isometr/.test(n)) {
        return "isometrico";
    }

    if (
        /alongamento|mobilidade|stretch|flexibilidade/.test(n)
    ) {
        return "mobilidade";
    }

    if (/flexao|flexoes|push up|push-up/.test(n)) {
        return "pesoCorporal";
    }

    if (
        /barras|barra fixa|triceps no banco|fundos|dips/.test(n) &&
        !/polia/.test(n)
    ) {
        return "pesoCorporal";
    }

    if (/halteres|halter|dumbbell/.test(n)) {
        return "halteres";
    }

    if (
        grupo === "Core" &&
        /prancha/.test(n)
    ) {
        return "isometrico";
    }

    if (
        /cardio/.test(
            normalizarTexto(grupo)
        )
    ) {
        return "cardio";
    }

    return "musculacao";
}


function inferirGrupoExercicio(nome) {

    const n = normalizarTexto(nome);

    if (
        /supino|peito|crucifixo|abertura|press de peito|voador/.test(n)
    ) {
        return "Peito";
    }

    if (
        /costas|puxada|remada|pulldown|pull up|barra fixa/.test(n)
    ) {
        return "Costas";
    }

    if (
        /perna|agachamento|leg press|quadric|femoral|glute|abdutora|adutora|panturrilha|peso morto|deadlift/.test(n)
    ) {
        return "Pernas";
    }

    if (
        /ombro|elevacao lateral|elevacao frontal|militar|press de ombro/.test(n)
    ) {
        return "Ombros";
    }

    if (
        /bicep|biceps|tricep|triceps|braco|curl|rosca|polia/.test(n)
    ) {
        return "Braços";
    }

    if (
        /abdom|core|prancha|crunch|lombar/.test(n)
    ) {
        return "Core";
    }

    if (
        /passadeira|bicicleta|eliptica|remo|cardio/.test(n)
    ) {
        return "Cardio";
    }

    return "Outro";
}


function metadadosExercicio(
    nome,
    meta = {}
) {

    const grupo =
        meta.grupo ||
        inferirGrupoExercicio(nome);

    return {
        nome,
        grupo,
        tipo:
            meta.tipo ||
            inferirTipoExercicio(
                nome,
                grupo
            ),
        personalizado:
            !!meta.personalizado,
        id:
            meta.id || null
    };
}


/* =========================================================
   CONSTRUÇÃO E PESQUISA DA BIBLIOTECA
   ========================================================= */

function maquinaPorExercicio(nome) {

    const n = normalizarTexto(nome);

    if (/peck deck|crucifixo|abertura/.test(n)) {
        return "Peck Deck";
    }

    if (/supino|press de peito/.test(n)) {
        return "Banco de Peso";
    }

    if (/puxada|remada sentada|triceps na polia|tríceps na polia/.test(n)) {
        return "Polia Multifuncional";
    }

    if (/remada com halteres|halteres|halter|curl|rosca|elevacao lateral|elevação lateral|peso livre|agachamento/.test(n)) {
        return "Peso Livre";
    }

    if (/leg press/.test(n)) {
        return "Leg Press";
    }

    if (/extensao de pernas|extensão de pernas/.test(n)) {
        return "Cadeira Extensora";
    }

    if (/flexao de pernas|flexão de pernas/.test(n)) {
        return "Mesa Flexora";
    }

    if (/abdutora|adutora/.test(n)) {
        return "Máquina Abdutora/Adutora";
    }

    if (/passadeira|caminhada|corrida/.test(n)) {
        return "Passadeira";
    }

    if (/bicicleta|pedal/.test(n)) {
        return "Bicicleta";
    }

    if (/eliptica|elíptica/.test(n)) {
        return "Elíptica";
    }

    if (/remo/.test(n)) {
        return "Máquina de Remo";
    }

    if (/smith/.test(n)) {
        return "Smith Machine";
    }

    return "Peso Livre";
}

function construirBibliotecaExercicios() {

    const mapa = new Map();

    exerciciosDisponiveis.forEach(nome => {

        const meta = metadadosExercicio(nome);

        mapa.set(
            normalizarTexto(nome),
            {
                ...meta,
                maquina: maquinaPorExercicio(nome)
            }
        );
    });

    if (Array.isArray(window.exerciciosBiblioteca)) {

        window.exerciciosBiblioteca.forEach(item => {

            if (!item?.nome) {
                return;
            }

            const meta = metadadosExercicio(
                item.nome,
                {
                    grupo: item.grupo
                }
            );

            mapa.set(
                normalizarTexto(item.nome),
                {
                    ...meta,
                    maquina:
                        item.maquina ||
                        maquinaPorExercicio(item.nome),
                    descricao: item.descricao || ""
                }
            );
        });
    }

    if (Array.isArray(exerciciosPersonalizados)) {

        exerciciosPersonalizados.forEach(item => {

            if (!item?.nome) {
                return;
            }

            const meta = metadadosExercicio(
                item.nome,
                {
                    grupo: item.grupo,
                    tipo: item.tipo,
                    personalizado: true,
                    id: item.id
                }
            );

            mapa.set(
                normalizarTexto(item.nome),
                {
                    ...meta,
                    maquina:
                        item.maquina ||
                        maquinaPorExercicio(item.nome),
                    descricao: item.descricao || ""
                }
            );
        });
    }

    return [...mapa.values()];
}


function pesquisarExercicios(termo) {

    const q = normalizarTexto(termo);

    const sinonimos = {

        bicep: [
            "biceps",
            "bracos",
            "curl",
            "rosca"
        ],

        biceps: [
            "biceps",
            "bracos",
            "curl",
            "rosca"
        ],

        tricep: [
            "triceps",
            "bracos",
            "polia"
        ],

        triceps: [
            "triceps",
            "bracos",
            "polia"
        ],

        perna: [
            "pernas",
            "agachamento",
            "leg press"
        ],

        pernas: [
            "pernas",
            "agachamento",
            "leg press"
        ],

        peito: [
            "peito",
            "supino",
            "crucifixo",
            "abertura"
        ],

        costas: [
            "costas",
            "remada",
            "puxada"
        ],

        ombro: [
            "ombros",
            "elevacao",
            "press"
        ],

        ombros: [
            "ombros",
            "elevacao",
            "press"
        ],

        abdominais: [
            "core",
            "abdom",
            "prancha"
        ],

        abdominal: [
            "core",
            "abdom",
            "prancha"
        ],

        abs: [
            "core",
            "abdom",
            "prancha"
        ]
    };

    if (!q) {
        return construirBibliotecaExercicios();
    }

    const tokens =
        q.split(" ").filter(Boolean);

    const extras =
        sinonimos[q] || [];

    return construirBibliotecaExercicios()
        .filter(item => {

            const hay =
                normalizarTexto(
                    `${item.nome} ${item.grupo} ${
                        TIPOS_EXERCICIO[item.tipo]?.label || ""
                    }`
                );

            return (
                tokens.every(
                    t => hay.includes(t)
                ) ||
                hay.includes(q) ||
                extras.some(
                    token =>
                        hay.includes(
                            normalizarTexto(token)
                        )
                )
            );
        });
}


/* =========================================================
   HISTÓRICO E VALORES
   ========================================================= */

function normalizarDadosHistorico(
    registro,
    exercicio
) {

    const base = {
        ...(registro || {})
    };

    const tipo =
        exercicio.tipo ||
        inferirTipoExercicio(
            exercicio.nome,
            exercicio.grupo
        );

    if (
        base.carga == null &&
        base.peso != null
    ) {
        base.carga = base.peso;
    }

    if (
        base.repeticoes == null &&
        base.reps != null
    ) {
        base.repeticoes = base.reps;
    }

    if (
        base.series == null &&
        base.series != null
    ) {
        base.series = base.series;
    }

    base.tipo =
        base.tipo || tipo;

    return base;
}


function ultimoRegisto(x) {

    const h =
        Array.isArray(x.historico)
            ? x.historico
            : [];

    return h.length
        ? normalizarDadosHistorico(
              h[h.length - 1],
              x
          )
        : normalizarDadosHistorico(
              x,
              x
          );
}


function valorAtual(
    x,
    param
) {

    const u =
        ultimoRegisto(x);

    return u[param] != null
        ? u[param]
        : x[param] != null
            ? x[param]
            : "";
}


function formatarData() {

    return new Date()
        .toLocaleDateString(
            "pt-PT"
        );
}


function formatarValor(
    param,
    val
) {

    if (
        val == null ||
        val === ""
    ) {
        return "—";
    }

    return `${escapeHtml(val)}${
        PARAMETROS[param]?.unit
            ? ` ${PARAMETROS[param].unit}`
            : ""
    }`;
}


function resumoRegisto(x) {

    const meta =
        metadadosExercicio(
            x.nome,
            {
                grupo: x.grupo,
                tipo: x.tipo,
                personalizado:
                    x.personalizado
            }
        );

    return meta.tipo
        ? TIPOS_EXERCICIO[
              meta.tipo
          ]
              .params
              .map(
                  p =>
                      formatarValor(
                          p,
                          valorAtual(
                              x,
                              p
                          )
                      )
              )
              .filter(
                  v => v !== "—"
              )
              .join(" · ")
        : "";
}


/* =========================================================
   SÉRIES
   ========================================================= */

function numeroSeriesExercicio(
    exercicio
) {

    const arr =
        Array.isArray(
            exercicio?.seriesData
        )
            ? exercicio.seriesData
            : [];

    if (arr.length) {
        return arr.length;
    }

    const n =
        Number(
            exercicio?.series
        );

    return Number.isFinite(n) &&
        n > 0
        ? Math.floor(n)
        : 1;
}


function extrairSeriesExercicio(
    exercicio
) {

    const tipo =
        exercicio?.tipo ||
        inferirTipoExercicio(
            exercicio?.nome || "",
            exercicio?.grupo || ""
        );

    const params =
        (
            TIPOS_EXERCICIO[
                tipo
            ]?.params ||
            TIPOS_EXERCICIO.outro.params
        )
        .filter(
            p => p !== "series"
        );

    if (
        Array.isArray(
            exercicio?.seriesData
        ) &&
        exercicio.seriesData.length
    ) {

        return exercicio.seriesData.map(
            s =>
                Object.fromEntries(
                    params.map(
                        p => [
                            p,
                            s?.[p] ?? ""
                        ]
                    )
                )
        );
    }

    const n =
        numeroSeriesExercicio(
            exercicio
        );

    return Array.from(
        {
            length: n
        },
        () =>
            Object.fromEntries(
                params.map(
                    p => [
                        p,
                        exercicio?.[p] ??
                            valorAtual(
                                exercicio,
                                p
                            ) ??
                            ""
                    ]
                )
            )
    );
}


function validarSeries(
    tipo,
    seriesData
) {

    const params =
        (
            TIPOS_EXERCICIO[
                tipo
            ]?.params ||
            TIPOS_EXERCICIO.outro.params
        )
        .filter(
            p => p !== "series"
        );

    if (
        !Array.isArray(
            seriesData
        ) ||
        !seriesData.length
    ) {

        return "Indica pelo menos uma série.";
    }

    for (
        const serie of seriesData
    ) {

        let temValor = false;

        for (
            const p of params
        ) {

            if (
                serie[p] !== undefined &&
                serie[p] !== ""
            ) {

                temValor = true;

                if (
                    !Number.isFinite(
                        Number(
                            serie[p]
                        )
                    )
                ) {

                    return `Verifica o valor de ${
                        PARAMETROS[p]?.label ||
                        p
                    }.`;
                }

                if (
                    Number(serie[p]) < 0
                ) {

                    return "Os valores não podem ser negativos.";
                }
            }
        }

        if (!temValor) {

            return "Preenche pelo menos um valor em cada série.";
        }

        if (
            params.includes(
                "repeticoes"
            ) &&
            serie.repeticoes !== "" &&
            serie.repeticoes != null &&
            Number(
                serie.repeticoes
            ) < 1
        ) {

            return "As repetições devem ser pelo menos 1.";
        }
    }

    return null;
}


/* =========================================================
   RENDERIZAÇÃO DAS LINHAS DE SÉRIES
   ========================================================= */

function renderLinhasSeries(
    container,
    exercicio,
    seriesCount
) {

    if (!container) {
        return;
    }

    const tipo =
        exercicio?.tipo ||
        inferirTipoExercicio(
            exercicio?.nome || "",
            exercicio?.grupo || ""
        );

    const params =
        (
            TIPOS_EXERCICIO[
                tipo
            ]?.params ||
            TIPOS_EXERCICIO.outro.params
        )
        .filter(
            p => p !== "series"
        );

    const existing =
        Array.isArray(
            exercicio?.seriesData
        ) &&
        exercicio.seriesData.length
            ? exercicio.seriesData
            : extrairSeriesExercicio(
                  exercicio || {}
              );

    const count =
        Math.max(
            1,
            Math.min(
                30,
                Number(
                    seriesCount
                ) || 1
            )
        );

    container.innerHTML =
        Array.from(
            {
                length: count
            },
            (_, i) => {

                const serie =
                    existing[i] || {};

                return `
                    <div class="set-entry-card">

                        <div class="set-entry-title">
                            <span>
                                SÉRIE ${i + 1}
                            </span>

                            <small>
                                Valores independentes
                            </small>
                        </div>

                        <div class="set-entry-fields">

                            ${params
                                .map(p => {

                                    const cfg =
                                        PARAMETROS[p];

                                    const val =
                                        serie[p] ?? "";

                                    return `
                                        <div class="adaptive-field">

                                            <label
                                                for="series_${i}_${p}"
                                            >
                                                ${cfg.label}

                                                ${
                                                    cfg.unit
                                                        ? ` <span>(${cfg.unit})</span>`
                                                        : ""
                                                }
                                            </label>

                                            <input
                                                id="series_${i}_${p}"
                                                data-series-index="${i}"
                                                data-param="${p}"
                                                class="input series-value-input"
                                                type="number"
                                                min="0"
                                                step="${cfg.step}"
                                                placeholder="${cfg.placeholder}"
                                                value="${
                                                    val !== ""
                                                        ? escapeHtml(
                                                              val
                                                          )
                                                        : ""
                                                }"
                                            >

                                        </div>
                                    `;

                                })
                                .join("")}

                        </div>
                    </div>
                `;
            }
        )
        .join("");
}


function recolherSeries(
    container,
    tipo
) {

    const params =
        (
            TIPOS_EXERCICIO[
                tipo
            ]?.params ||
            TIPOS_EXERCICIO.outro.params
        )
        .filter(
            p => p !== "series"
        );

    const count =
        [
            ...new Set(
                [
                    ...container.querySelectorAll(
                        "[data-series-index]"
                    )
                ].map(
                    el =>
                        Number(
                            el.dataset.seriesIndex
                        )
                )
            )
        ].length;

    return Array.from(
        {
            length: count
        },
        (_, i) =>
            Object.fromEntries(
                params.map(
                    p => {

                        const input =
                            container.querySelector(
                                `[data-series-index="${i}"][data-param="${p}"]`
                            );

                        return [
                            p,
                            input &&
                            input.value !== ""
                                ? Number(
                                      input.value
                                  )
                                : ""
                        ];
                    }
                )
            )
    );
}


function serieResumo(
    tipo,
    serie
) {

    const params =
        (
            TIPOS_EXERCICIO[
                tipo
            ]?.params ||
            TIPOS_EXERCICIO.outro.params
        )
        .filter(
            p => p !== "series"
        );

    return params
        .map(
            p =>
                serie?.[p] !== "" &&
                serie?.[p] != null
                    ? `${PARAMETROS[p].label}: ${formatarValor(
                          p,
                          serie[p]
                      )}`
                    : null
        )
        .filter(Boolean)
        .join(" · ");
}


function historicoComSeries(
    exercicio,
    row
) {

    const tipo =
        row?.tipo ||
        exercicio?.tipo ||
        inferirTipoExercicio(
            exercicio?.nome || "",
            exercicio?.grupo || ""
        );

    if (
        Array.isArray(
            row?.seriesData
        )
    ) {

        return row.seriesData;
    }

    const fake = {
        ...exercicio,
        ...row,
        series:
            row?.series ||
            exercicio?.series
    };

    return extrairSeriesExercicio(
        fake
    );
}


/* =========================================================
   PÁGINA "MEU TREINO"
   ========================================================= */

function renderTreino() {

    const r =
        document.getElementById(
            "workout-root"
        );

    if (!r) {
        return;
    }

    const t =
        treinos[diaSelecionado] || {
            nome: "Treino",
            exercicios: []
        };

    const d =
        diasSemana.find(
            x =>
                x[0] === diaSelecionado
        ) ||
        diasSemana[0];


    r.innerHTML = `

        <div class="days-selector">

            ${diasSemana
                .map(
                    x => `
                        <button
                            class="day-button ${
                                x[0] === diaSelecionado
                                    ? "active"
                                    : ""
                            }"
                            data-day="${x[0]}"
                        >

                            <strong>
                                ${x[1]}
                            </strong>

                            <span>
                                ${
                                    treinos[x[0]]
                                        ?.exercicios
                                        ?.length || ""
                                }
                            </span>

                        </button>
                    `
                )
                .join("")}

        </div>


        ${
            diaSelecionado === "domingo"
                ? `
                    <div class="gym-closed-message">

                        <strong>
                            Ginásio Encerrado
                        </strong>


                    </div>
                `
                : ""
        }


        <div class="selected-day">

            <div>

                <span class="eyebrow">
                    DIA SELECIONADO
                </span>

                <h3>
                    ${d[2]}
                </h3>

            </div>

            <button
                class="edit-workout-btn"
                id="editWorkoutName"
            >
                Editar nome
            </button>

        </div>


        <div class="workout-name-card">

            <strong>
                ${escapeHtml(
                    t.nome || "Treino"
                )}
            </strong>

            <span>
                ${t.exercicios.length}
                exercício(s)
            </span>

        </div>


        <div class="exercise-list">

            ${
                t.exercicios.length
                    ? t.exercicios
                          .map(
                              (x, i) =>
                                  renderExercicioCard(
                                      x,
                                      i
                                  )
                          )
                          .join("")
                    : `
                        <div class="empty-workout">

                            <strong>
                                Este dia ainda não tem exercícios
                            </strong>

                            <p>
                                Adiciona vários exercícios
                                para construir o teu treino.
                            </p>

                        </div>
                    `
            }

        </div>


        <button
            class="add-exercise-main"
            id="addExercise"
        >
            + Adicionar exercício
        </button>

    `;


    /* =====================================================
       EVENTOS DOS DIAS
       ===================================================== */

    document
        .querySelectorAll(".day-button")
        .forEach(
            b => {

                b.onclick = () => {

                    diaSelecionado =
                        b.dataset.day;

                    renderTreino();
                };
            }
        );


    /* =====================================================
       ADICIONAR EXERCÍCIO
       ===================================================== */

    document.getElementById(
        "addExercise"
    ).onclick =
        abrirAdicionar;


    /* =====================================================
       EDITAR NOME
       ===================================================== */

    document.getElementById(
        "editWorkoutName"
    ).onclick = () => {

        const n =
            prompt(
                "Nome do treino:",
                t.nome
            );

        if (n?.trim()) {

            t.nome =
                n.trim();

            save();
            renderTreino();
        }
    };


    /* =====================================================
       REMOVER EXERCÍCIO
       ===================================================== */

    document
        .querySelectorAll(
            ".delete-exercise"
        )
        .forEach(
            b => {

                b.onclick = () => {

                    t.exercicios.splice(
                        Number(
                            b.dataset.index
                        ),
                        1
                    );

                    save();
                    renderTreino();
                };
            }
        );


    /* =====================================================
       VER PROGRESSÃO
       ===================================================== */

    document
        .querySelectorAll(
            ".progress-button"
        )
        .forEach(
            b => {

                b.onclick = () => {

                    mostrarProgressao(
                        t.exercicios[
                            Number(
                                b.dataset.index
                            )
                        ]
                    );
                };
            }
        );


    /* =====================================================
       ATUALIZAR EXERCÍCIO
       ===================================================== */

    document
        .querySelectorAll(
            ".update-exercise-button"
        )
        .forEach(
            b => {

                b.onclick = () => {

                    abrirEditorExercicio(
                        t.exercicios[
                            Number(
                                b.dataset.index
                            )
                        ]
                    );
                };
            }
        );
}


/* =========================================================
   CARTÃO DE EXERCÍCIO
   ========================================================= */

function renderExercicioCard(
    x,
    i
) {

    const meta =
        metadadosExercicio(
            x.nome,
            {
                grupo: x.grupo,
                tipo: x.tipo,
                personalizado:
                    x.personalizado
            }
        );

    const tipoLabel =
        TIPOS_EXERCICIO[
            meta.tipo
        ]?.label ||
        "Outro";

    const series =
        extrairSeriesExercicio(
            {
                ...x,
                tipo: meta.tipo
            }
        );

    const seriesHtml =
        series
            .map(
                (s, n) => `
                    <div class="series-card-line">

                        <span>
                            Série ${n + 1}
                        </span>

                        <strong>
                            ${escapeHtml(
                                serieResumo(
                                    meta.tipo,
                                    s
                                ) ||
                                "Sem valores"
                            )}
                        </strong>

                    </div>
                `
            )
            .join("");

    return `
        <article class="exercise-card">

            <div class="exercise-top">

                <div class="exercise-number">
                    ${String(
                        i + 1
                    ).padStart(2, "0")}
                </div>

                <div class="exercise-info">

                    <strong>
                        ${escapeHtml(
                            x.nome
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            tipoLabel
                        )}

                        ${
                            meta.personalizado
                                ? " · Personalizado"
                                : ""
                        }
                    </span>

                </div>

                <button
                    class="delete-exercise"
                    data-index="${i}"
                    aria-label="Remover exercício"
                >
                    ×
                </button>

            </div>


            <div class="exercise-series-list">

                ${seriesHtml}

            </div>


            <div class="exercise-card-actions">

                <button
                    class="secondary-btn update-exercise-button"
                    data-index="${i}"
                >
                    🔵 Atualizar
                </button>

                <button
                    class="progress-button"
                    data-index="${i}"
                >
                    🟣 Ver progressão →
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   ADICIONAR EXERCÍCIO
   ========================================================= */

function abrirAdicionar() {

    const r =
        document.getElementById(
            "workout-root"
        );

    r.innerHTML = `

        <button
            class="back-button"
            id="backWorkout"
        >
            ← Voltar
        </button>


        <div class="workout-header">

            <span class="eyebrow">
                NOVO EXERCÍCIO
            </span>

            <h2>
                Adicionar exercício
            </h2>

            <p class="muted">
                Escolhe primeiro o exercício.
                Depois define o número de séries
                e os valores de cada série.
            </p>

        </div>


        <div class="form-card workout-add-form">

            <label>
                Exercício
            </label>


            <div class="exercise-picker-trigger-wrap">

                <input
                    id="exerciseName"
                    class="input exercise-name-input"
                    type="text"
                    placeholder="Selecionar exercício"
                    readonly
                >

                <button
                    type="button"
                    class="exercise-picker-trigger"
                    id="openExercisePicker"
                >
                    <span>⌕</span>
                    Escolher exercício
                </button>

            </div>


            <div
                class="exercise-selection-hint"
                id="exerciseSelectionHint"
            >
                Procura um exercício existente
                ou cria um novo.
            </div>


            <div id="exerciseTypeWrap"></div>


            <div
                id="seriesSetup"
                class="series-setup"
                hidden
            >

                <div class="series-count-row">

                    <div>

                        <label for="seriesCount">
                            Número de séries
                        </label>

                        <small>
                            Depois poderás definir
                            os valores de cada série
                            individualmente.
                        </small>

                    </div>

                    <input
                        id="seriesCount"
                        class="input series-count-input"
                        type="number"
                        min="1"
                        max="30"
                        value="1"
                    >

                </div>


                <button
                    class="primary-btn full"
                    id="continueSeries"
                >
                    Continuar
                </button>

            </div>


            <div
                id="exerciseFields"
                class="adaptive-exercise-fields"
            ></div>


            <button
                class="primary-btn full"
                id="saveExercise"
                hidden
            >
                Adicionar ao treino
            </button>

        </div>

    `;


    document.getElementById(
        "backWorkout"
    ).onclick =
        renderTreino;


    document.getElementById(
        "openExercisePicker"
    ).onclick =
        abrirSeletorExercicio;


    document.getElementById(
        "continueSeries"
    ).onclick = () => {

        const input =
            document.getElementById(
                "exerciseName"
            );

        const tipo =
            document.getElementById(
                "exerciseType"
            )?.value ||
            input?.dataset.tipo;

        if (
            !input?.value ||
            !tipo
        ) {

            return alert(
                "Escolhe primeiro um exercício."
            );
        }


        const n =
            Math.max(
                1,
                Math.min(
                    30,
                    Number(
                        document.getElementById(
                            "seriesCount"
                        )?.value
                    ) || 1
                )
            );


        document.getElementById(
            "seriesCount"
        ).value = n;


        renderLinhasSeries(
            document.getElementById(
                "exerciseFields"
            ),
            {
                nome: input.value,
                tipo
            },
            n
        );


        document.getElementById(
            "saveExercise"
        ).hidden = false;


        document.getElementById(
            "seriesSetup"
        ).hidden = true;
    };


    document.getElementById(
        "saveExercise"
    ).onclick =
        guardarExercicio;


    requestAnimationFrame(
        abrirSeletorExercicio
    );
}


/* =========================================================
   SELETOR DE EXERCÍCIOS
   ========================================================= */

function garantirEstilosBiblioteca() {

    if (document.getElementById("exercise-library-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "exercise-library-styles";

    style.textContent = `
        .exercise-picker-controls {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 6px;
            padding: 0 18px 8px;
            width: 100%;
            box-sizing: border-box;
            flex-shrink: 0;
        }

        .exercise-picker-control {
            min-width: 0;
            height: 32px;
            padding: 0 6px;
            border-radius: 10px;
            border: 1px solid rgba(57,40,61,.12);
            background: #faf6f1;
            color: #665968;
            font-size: 9px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .exercise-picker-control.active {
            background: rgba(104,64,111,.10);
            color: #68406f;
            border-color: rgba(104,64,111,.24);
        }

        .exercise-filter-options {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
            padding: 0 18px 8px;
            box-sizing: border-box;
            overflow-x: auto;
            scrollbar-width: none;
            flex-shrink: 0;
            position: relative;
            z-index: 4;
        }

        .exercise-filter-options::-webkit-scrollbar {
            display: none;
        }

        .exercise-filter-option {
            flex: 0 0 auto;
            height: 27px;
            padding: 0 10px;
            border-radius: 999px;
            border: 1px solid rgba(57,40,61,.11);
            background: #fffdf9;
            color: #6f6673;
            font-size: 8.5px;
            font-weight: 750;
            white-space: nowrap;
        }

        .exercise-filter-option.active {
            background: linear-gradient(135deg,#68406f,#3e9d9a);
            color: #fff;
            border-color: transparent;
        }

        .exercise-search-results {
            min-height: 0;
            overflow-y: auto;
            flex: 1 1 auto;
        }

        .exercise-search-result {
            display: flex !important;
            align-items: center;
            width: 100%;
            box-sizing: border-box;
            gap: 0;
        }

        .exercise-search-main {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            border: 0;
            background: transparent;
            color: inherit;
            text-align: left;
            padding: 0;
        }

        .exercise-favorite-button {
            width: 34px;
            height: 34px;
            flex: 0 0 34px;
            display: grid;
            place-items: center;
            border: 0;
            background: transparent;
            color: #b8adb9;
            font-size: 22px;
            line-height: 1;
            padding: 0;
        }

        .exercise-favorite-button.active {
            color: #d6a63a;
        }

        .custom-create-control {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, rgba(214, 112, 188, .18), rgba(62, 157, 154, .10));
            color: #9b4b91;
            border-color: rgba(214, 112, 188, .35);
            font-size: 9px;
        }

        .custom-create-control:active {
            transform: scale(.98);
        }

        .custom-exercise-overlay {
            position: fixed;
            inset: 0;
            z-index: 10050;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            background: rgba(24, 17, 28, .48);
            backdrop-filter: blur(5px);
        }

        .custom-exercise-modal {
            width: min(100%, 430px);
            max-height: min(90vh, 700px);
            overflow-y: auto;
            box-sizing: border-box;
            border-radius: 24px;
            padding: 20px;
            background: #fffdf9;
            border: 1px solid rgba(57,40,61,.10);
            box-shadow: 0 24px 70px rgba(39, 24, 45, .22);
        }

        .custom-exercise-modal-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 18px;
        }

        .custom-exercise-modal-top h2 {
            margin: 4px 0 0;
        }

        .custom-exercise-form {
            display: grid;
            gap: 14px;
        }

        .custom-exercise-field {
            display: grid;
            gap: 7px;
        }

        .custom-exercise-field label {
            font-size: 12px;
            font-weight: 800;
        }

        .custom-exercise-field small {
            font-size: 10px;
            line-height: 1.35;
            color: #8b7f8c;
        }

        .custom-exercise-field textarea.input {
            min-height: 90px;
            resize: vertical;
        }

        .custom-exercise-actions {
            display: grid;
            grid-template-columns: 1fr 1.35fr;
            gap: 8px;
            margin-top: 4px;
        }

        .custom-exercise-actions button {
            min-height: 44px;
        }

        body[data-theme="dark"] .custom-create-control {
            background: rgba(214, 112, 188, .12);
            color: #e1a5d3;
            border-color: rgba(214, 112, 188, .28);
        }

        body[data-theme="dark"] .custom-exercise-modal {
            background: #111824;
            border-color: var(--line);
            color: #eef2f8;
        }

        body[data-theme="dark"] .custom-exercise-field small {
            color: #9aa6ba;
        }

        body[data-theme="dark"] .custom-exercise-overlay {
            background: rgba(4, 8, 14, .68);
        }

        body[data-theme="light"] .custom-create-control {
            background: linear-gradient(135deg, rgba(214, 112, 188, .13), rgba(62, 157, 154, .10));
            color: #9b4b91;
            border-color: rgba(214, 112, 188, .32);
        }

        body[data-theme="dark"] .exercise-picker-control {
            background: #111824;
            color: #aab5c9;
            border-color: var(--line);
        }

        body[data-theme="dark"] .exercise-picker-control.active {
            background: rgba(104,64,111,.18);
            color: #d2b9d7;
            border-color: rgba(104,64,111,.30);
        }

        body[data-theme="dark"] .exercise-filter-options {
            background: var(--bg-soft);
        }

        body[data-theme="dark"] .exercise-filter-option {
            background: #111824;
            color: #aab5c9;
            border-color: var(--line);
        }

        body[data-theme="light"] .exercise-picker-control {
            background: #faf6f1;
            color: #665968;
        }
    `;

    document.head.appendChild(style);
}

function abrirSeletorExercicio() {

    fecharSeletorExercicio();
    garantirEstilosBiblioteca();

    filtroBiblioteca = "todos";
    valorFiltroBiblioteca = "Todos";
    favoritosApenas = false;

    const overlay = document.createElement("div");
    overlay.className = "exercise-picker-overlay open";
    overlay.id = "exercisePickerOverlay";

    overlay.innerHTML = `
        <div
            class="exercise-picker"
            role="dialog"
            aria-modal="true"
        >

            <div class="exercise-picker-handle"></div>

            <div class="exercise-picker-header">
                <div>
                    <span class="eyebrow">
                        BIBLIOTECA DE EXERCÍCIOS
                    </span>
                    <h2>Adicionar exercício</h2>
                </div>

                <button
                    type="button"
                    class="exercise-picker-close"
                    id="closeExercisePicker"
                >
                    ×
                </button>
            </div>

            <div class="exercise-search-wrap">
                <span class="exercise-search-icon">⌕</span>
                <input
                    id="exerciseSearch"
                    class="exercise-search-input"
                    type="search"
                    placeholder="Procurar ou escrever exercício..."
                    autocomplete="off"
                    spellcheck="false"
                >
            </div>

            <div class="exercise-picker-controls">
                <button
                    type="button"
                    class="exercise-picker-control active"
                    data-control="todos"
                >
                    Todos
                </button>

                <button
                    type="button"
                    class="exercise-picker-control"
                    data-control="favoritos"
                >
                    ★ Favoritos
                </button>

                <button
                    type="button"
                    class="exercise-picker-control"
                    data-control="musculos"
                >
                    Músculos
                </button>

                <button
                    type="button"
                    class="exercise-picker-control"
                    data-control="maquinas"
                >
                    Máquinas
                </button>

                <button
                    type="button"
                    class="exercise-picker-control custom-create-control"
                    id="openCustomExerciseCreator"
                >
                    ＋ Adicionar exercício personalizado
                </button>
            </div>

            <div
                class="exercise-filter-options"
                id="exerciseFilterOptions"
            ></div>

            <div
                class="exercise-search-meta"
                id="exerciseSearchMeta"
            ></div>

            <div
                class="exercise-search-results"
                id="exerciseSearchResults"
            ></div>

        </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById("exerciseSearch");

    const render = () =>
        renderResultadosPesquisa(input.value);

    input.addEventListener("input", render);

    document.getElementById(
        "closeExercisePicker"
    ).onclick = fecharSeletorExercicio;

    overlay.addEventListener("click", e => {
        if (e.target === overlay) {
            fecharSeletorExercicio();
        }
    });

    overlay
        .querySelectorAll(".exercise-picker-control")
        .forEach(button => {

            button.addEventListener("click", () => {

                const control = button.dataset.control;

                filtroBiblioteca = "todos";
                valorFiltroBiblioteca = "Todos";

                if (control === "todos") {
                    favoritosApenas = false;
                }

                if (control === "favoritos") {
                    favoritosApenas = true;
                }

                if (
                    control === "musculos" ||
                    control === "maquinas"
                ) {
                    favoritosApenas = false;
                    filtroBiblioteca = control;
                    renderOpcoesFiltroBiblioteca(control);
                } else {
                    const options = document.getElementById(
                        "exerciseFilterOptions"
                    );
                    if (options) {
                        options.innerHTML = "";
                    }
                }

                overlay
                    .querySelectorAll(
                        ".exercise-picker-control"
                    )
                    .forEach(x =>
                        x.classList.remove("active")
                    );

                button.classList.add("active");

                render();
            });
        });

    document.getElementById(
        "openCustomExerciseCreator"
    )?.addEventListener(
        "click",
        abrirPopupExercicioPersonalizado
    );

    document.addEventListener(
        "keydown",
        fecharSeletorPorTecla
    );

    render();

    requestAnimationFrame(() => input.focus());
}


function fecharSeletorPorTecla(e) {

    if (
        e.key === "Escape"
    ) {
        fecharSeletorExercicio();
    }
}


function fecharSeletorExercicio() {

    document
        .getElementById(
            "exercisePickerOverlay"
        )
        ?.remove();

    document.removeEventListener(
        "keydown",
        fecharSeletorPorTecla
    );
}


/* =========================================================
   PESQUISA DE EXERCÍCIOS
   ========================================================= */

function renderOpcoesFiltroBiblioteca(tipo) {

    const container =
        document.getElementById(
            "exerciseFilterOptions"
        );

    if (!container) {
        return;
    }

    const biblioteca =
        construirBibliotecaExercicios();

    let opcoes = [];

    if (tipo === "musculos") {
        opcoes = [
            "Todos",
            ...new Set(
                biblioteca
                    .map(item => item.grupo)
                    .filter(Boolean)
            )
        ];
    }

    if (tipo === "maquinas") {
        opcoes = [
            "Todos",
            ...new Set(
                biblioteca
                    .map(item => item.maquina)
                    .filter(Boolean)
            )
        ];
    }

    container.innerHTML =
        opcoes
            .map(opcao => `
                <button
                    type="button"
                    class="exercise-filter-option ${
                        opcao === valorFiltroBiblioteca
                            ? "active"
                            : ""
                    }"
                    data-value="${escaparAtributo(opcao)}"
                >
                    ${escapeHtml(opcao)}
                </button>
            `)
            .join("");

    container
        .querySelectorAll(".exercise-filter-option")
        .forEach(button => {

            button.onclick = () => {

                valorFiltroBiblioteca =
                    button.dataset.value;

                container
                    .querySelectorAll(
                        ".exercise-filter-option"
                    )
                    .forEach(x =>
                        x.classList.remove("active")
                    );

                button.classList.add("active");

                renderResultadosPesquisa(
                    document.getElementById(
                        "exerciseSearch"
                    )?.value || ""
                );
            };
        });
}

function abrirPopupExercicioPersonalizado() {

    document
        .getElementById("customExerciseOverlay")
        ?.remove();

    const searchValue =
        document.getElementById("exerciseSearch")?.value?.trim() || "";

    const grupos = [
        "Peito",
        "Costas",
        "Pernas",
        "Ombros",
        "Braços",
        "Core",
        "Cardio",
        "Outro"
    ];

    const maquinas = [
        "Sem equipamento",
        ...new Set(
            construirBibliotecaExercicios()
                .map(item => item.maquina)
                .filter(Boolean)
        )
    ];

    const grupoInicial =
        grupos.includes(inferirGrupoExercicio(searchValue))
            ? inferirGrupoExercicio(searchValue)
            : "Outro";

    const tipoInicial =
        inferirTipoExercicio(
            searchValue || "Novo exercício",
            grupoInicial
        );

    const maquinaInferida =
        searchValue
            ? maquinaPorExercicio(searchValue)
            : "Sem equipamento";

    const maquinaInicial =
        maquinas.includes(maquinaInferida)
            ? maquinaInferida
            : "Sem equipamento";

    const overlay = document.createElement("div");
    overlay.className = "custom-exercise-overlay open";
    overlay.id = "customExerciseOverlay";

    overlay.innerHTML = `

        <div
            class="custom-exercise-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customExerciseTitle"
        >

            <div class="custom-exercise-modal-top">

                <div>
                    <span class="eyebrow">
                        NOVO EXERCÍCIO
                    </span>

                    <h2 id="customExerciseTitle">
                        Adicionar exercício personalizado
                    </h2>

                    <p class="muted">
                        Cria o exercício e guarda-o na tua biblioteca.
                    </p>
                </div>

                <button
                    type="button"
                    class="exercise-picker-close"
                    id="closeCustomExercise"
                    aria-label="Fechar"
                >
                    ×
                </button>

            </div>

            <div class="custom-exercise-form">

                <div class="custom-exercise-field">
                    <label for="customExerciseName">
                        Nome do exercício
                    </label>

                    <input
                        id="customExerciseName"
                        class="input"
                        type="text"
                        maxlength="80"
                        placeholder="Ex.: Agachamento búlgaro"
                        value="${escapeHtml(searchValue)}"
                        autocomplete="off"
                    >
                </div>

                <div class="custom-exercise-field">
                    <label for="customExerciseGroup">
                        Grupo muscular
                    </label>

                    <select
                        id="customExerciseGroup"
                        class="input"
                    >
                        ${grupos
                            .map(grupo => `
                                <option
                                    value="${escaparAtributo(grupo)}"
                                    ${
                                        grupo === grupoInicial
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHtml(grupo)}
                                </option>
                            `)
                            .join("")}
                    </select>
                </div>

                <div class="custom-exercise-field">
                    <label for="customExerciseType">
                        Tipo de exercício
                    </label>

                    <select
                        id="customExerciseType"
                        class="input"
                    >
                        ${Object.entries(TIPOS_EXERCICIO)
                            .map(([key, value]) => `
                                <option
                                    value="${escaparAtributo(key)}"
                                    ${
                                        key === tipoInicial
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHtml(value.label)}
                                </option>
                            `)
                            .join("")}
                    </select>
                </div>

                <div class="custom-exercise-field">
                    <label for="customExerciseMachine">
                        Equipamento
                    </label>

                    <select
                        id="customExerciseMachine"
                        class="input"
                    >
                        ${maquinas
                            .map(maquina => `
                                <option
                                    value="${escaparAtributo(maquina)}"
                                    ${
                                        maquina === maquinaInicial
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHtml(maquina)}
                                </option>
                            `)
                            .join("")}
                    </select>
                </div>



                <div class="custom-exercise-actions">
                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelCustomExercise"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="primary-btn"
                        id="saveCustomExercise"
                    >
                        Adicionar exercício
                    </button>
                </div>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    const nameInput =
        document.getElementById("customExerciseName");

    let escapeHandler;

    const close = () => {
        overlay.remove();
        if (escapeHandler) {
            document.removeEventListener(
                "keydown",
                escapeHandler
            );
        }
    };

    document.getElementById("closeCustomExercise").onclick = close;
    document.getElementById("cancelCustomExercise").onclick = close;

    overlay.addEventListener("click", e => {
        if (e.target === overlay) {
            close();
        }
    });

    escapeHandler = e => {
        if (e.key === "Escape") {
            close();
        }
    };

    document.addEventListener(
        "keydown",
        escapeHandler
    );

    document.getElementById("saveCustomExercise").onclick = () => {

        const nome =
            nameInput?.value.trim() || "";

        const grupo =
            document.getElementById("customExerciseGroup")?.value || "Outro";

        const tipo =
            document.getElementById("customExerciseType")?.value ||
            inferirTipoExercicio(nome, grupo);

        const maquina =
            document.getElementById("customExerciseMachine")?.value ||
            "Sem equipamento";

        const descricao =
            document.getElementById("customExerciseDescription")?.value.trim() || "";

        if (!nome) {
            alert("Indica o nome do exercício.");
            nameInput?.focus();
            return;
        }

        const biblioteca = construirBibliotecaExercicios();

        const jaExiste = biblioteca.some(
            item =>
                normalizarTexto(item.nome) ===
                normalizarTexto(nome)
        );

        if (jaExiste) {
            alert("Já existe um exercício com esse nome na biblioteca.");
            nameInput?.focus();
            return;
        }

        const id =
            `custom-${Date.now()}`;

        const novo = {
            id,
            nome,
            grupo,
            tipo,
            maquina,
            descricao,
            personalizado: true,
            criadoEm: new Date().toISOString()
        };

        exerciciosPersonalizados.push(novo);
        saveExerciciosPersonalizados();

        close();

        selecionarExercicio(
            nome,
            true,
            novo
        );
    };

    requestAnimationFrame(() => {
        nameInput?.focus();
        nameInput?.select();
    });
}

function renderResultadosPesquisa(termo) {

    const results =
        document.getElementById(
            "exerciseSearchResults"
        );

    const meta =
        document.getElementById(
            "exerciseSearchMeta"
        );

    if (!results) {
        return;
    }

    const q =
        String(termo || "").trim();

    let lista =
        pesquisarExercicios(termo);

    if (favoritosApenas) {
        lista = lista.filter(item =>
            favoritosExercicios.includes(
                normalizarTexto(item.nome)
            )
        );
    }

    if (
        filtroBiblioteca === "musculos" &&
        valorFiltroBiblioteca !== "Todos"
    ) {
        lista = lista.filter(item =>
            item.grupo === valorFiltroBiblioteca
        );
    }

    if (
        filtroBiblioteca === "maquinas" &&
        valorFiltroBiblioteca !== "Todos"
    ) {
        lista = lista.filter(item =>
            item.maquina === valorFiltroBiblioteca
        );
    }

    if (meta) {
        meta.textContent =
            favoritosApenas
                ? `${lista.length} favorito(s)`
                : q
                    ? `${lista.length} resultado(s)`
                    : `${lista.length} exercícios disponíveis`;
    }

    const listaHtml =
        lista
            .map(item => {

                const favorito =
                    favoritosExercicios.includes(
                        normalizarTexto(item.nome)
                    );

                return `
                    <div class="exercise-search-result">

                        <button
                            type="button"
                            class="exercise-search-main"
                            data-exercise-name="${escaparAtributo(
                                item.nome
                            )}"
                        >

                            <span class="exercise-search-result-icon">
                                ${
                                    item.personalizado
                                        ? "✦"
                                        : "＋"
                                }
                            </span>

                            <span class="exercise-search-result-copy">
                                <strong>
                                    ${escapeHtml(item.nome)}
                                </strong>

                                <small>
                                    ${escapeHtml(item.grupo)}
                                    ·
                                    ${escapeHtml(item.maquina)}
                                    ${
                                        item.personalizado
                                            ? " · Personalizado"
                                            : ""
                                    }
                                </small>
                            </span>

                            <span class="exercise-search-result-arrow">
                                ›
                            </span>

                        </button>

                        <button
                            type="button"
                            class="exercise-favorite-button ${
                                favorito ? "active" : ""
                            }"
                            data-favorite-name="${escaparAtributo(
                                item.nome
                            )}"
                            aria-label="${
                                favorito
                                    ? "Remover dos favoritos"
                                    : "Adicionar aos favoritos"
                            }"
                        >
                            ${favorito ? "★" : "☆"}
                        </button>

                    </div>
                `;
            })
            .join("");

    results.innerHTML =
        lista.length
            ? listaHtml
            : `
                <div class="exercise-search-empty">

                    <div class="exercise-search-empty-icon">
                        ${favoritosApenas ? "★" : "⌕"}
                    </div>

                    <strong>
                        ${
                            favoritosApenas
                                ? "Ainda não tens favoritos."
                                : q
                                    ? "Não encontrámos este exercício."
                                    : "Pesquisa um exercício ou cria um novo."
                        }
                    </strong>

                    <p>
                        ${
                            favoritosApenas
                                ? "Carrega na estrela dos exercícios para os guardar aqui."
                                : q
                                    ? "Usa o botão + Criar no topo para adicionar um exercício personalizado."
                                    : "Escreve o nome na caixa acima para procurar um exercício."
                        }
                    </p>

                </div>
            `;

    results
        .querySelectorAll(".exercise-search-main")
        .forEach(btn => {

            btn.onclick = () => {

                const nome =
                    btn.dataset.exerciseName;

                const item =
                    construirBibliotecaExercicios()
                        .find(
                            x =>
                                normalizarTexto(x.nome) ===
                                normalizarTexto(nome)
                        );

                selecionarExercicio(
                    item?.nome || nome,
                    !!item?.personalizado,
                    item
                );
            };
        });

    results
        .querySelectorAll(
            ".exercise-favorite-button"
        )
        .forEach(btn => {

            btn.onclick = e => {

                e.stopPropagation();

                const nome =
                    normalizarTexto(
                        btn.dataset.favoriteName
                    );

                const index =
                    favoritosExercicios.indexOf(
                        nome
                    );

                if (index === -1) {
                    favoritosExercicios.push(nome);
                } else {
                    favoritosExercicios.splice(index, 1);
                }

                try {
                    localStorage.setItem(
                        STORAGE_FAVORITOS_EXERCICIOS,
                        JSON.stringify(
                            favoritosExercicios
                        )
                    );
                } catch (error) {
                    console.warn(
                        "Favoritos localStorage:",
                        error
                    );
                }

                renderResultadosPesquisa(
                    document.getElementById(
                        "exerciseSearch"
                    )?.value || ""
                );
            };
        });
}


/* =========================================================
   SELECIONAR EXERCÍCIO
   ========================================================= */

function selecionarExercicio(
    nome,
    personalizado = false,
    item = null
) {

    const input =
        document.getElementById(
            "exerciseName"
        );

    if (!input) {
        return;
    }


    const tipo =
        item?.tipo ||
        inferirTipoExercicio(
            nome,
            item?.grupo
        );


    input.value =
        nome;

    input.dataset.personalizado =
        personalizado
            ? "true"
            : "false";

    input.dataset.tipo =
        tipo;

    input.dataset.grupo =
        item?.grupo ||
        inferirGrupoExercicio(
            nome
        );

    input.dataset.maquina =
        item?.maquina ||
        maquinaPorExercicio(nome);

    input.dataset.descricao =
        item?.descricao ||
        "";


    const hint =
        document.getElementById(
            "exerciseSelectionHint"
        );


    if (hint) {

        hint.innerHTML =
            personalizado
                ? `
                    <span class="custom-selected-badge">
                        ✦ Exercício personalizado
                    </span>

                    Escolhe o tipo abaixo.
                `
                : `
                    <span class="existing-selected-badge">
                        ✓ Exercício selecionado
                    </span>

                    ${escapeHtml(
                        item?.grupo ||
                        inferirGrupoExercicio(
                            nome
                        )
                    )}
                `;
    }


    fecharSeletorExercicio();


    const wrap =
        document.getElementById(
            "exerciseTypeWrap"
        );


    if (personalizado) {

        wrap.innerHTML = `

            <div class="exercise-type-block">

                <label for="exerciseType">
                    Tipo de exercício
                </label>

                <select
                    id="exerciseType"
                    class="input"
                >

                    ${Object.entries(
                        TIPOS_EXERCICIO
                    )
                        .map(
                            ([key, v]) => `

                                <option
                                    value="${key}"
                                    ${
                                        key === tipo
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${v.label}
                                </option>

                            `
                        )
                        .join("")}

                </select>

            </div>

        `;

    } else {

        wrap.innerHTML =
            "";
    }


    document.getElementById(
        "seriesSetup"
    ).hidden =
        false;


    document.getElementById(
        "exerciseFields"
    ).innerHTML =
        "";


    document.getElementById(
        "saveExercise"
    ).hidden =
        true;
}


/* =========================================================
   GUARDAR NOVO EXERCÍCIO
   ========================================================= */

function guardarExercicio() {

    const nameInput =
        document.getElementById(
            "exerciseName"
        );

    const container =
        document.getElementById(
            "exerciseFields"
        );


    const nome =
        nameInput?.value.trim();


    if (!nome) {

        return alert(
            "Escolhe um exercício."
        );
    }


    const tipo =
        document.getElementById(
            "exerciseType"
        )?.value ||
        nameInput.dataset.tipo ||
        inferirTipoExercicio(
            nome,
            nameInput.dataset.grupo
        );


    const grupo =
        nameInput.dataset.grupo ||
        inferirGrupoExercicio(
            nome
        );


    const seriesData =
        recolherSeries(
            container,
            tipo
        );


    const error =
        validarSeries(
            tipo,
            seriesData
        );


    if (error) {
        return alert(error);
    }


    const personal =
        nameInput.dataset.personalizado ===
        "true";


    if (
        personal &&
        !exerciciosPersonalizados.some(
            x =>
                normalizarTexto(
                    x.nome
                ) ===
                normalizarTexto(
                    nome
                )
        )
    ) {

        exerciciosPersonalizados.push({

            id:
                `custom-${Date.now()}`,

            nome,

            grupo,

            tipo,

            maquina:
                nameInput.dataset.maquina ||
                maquinaPorExercicio(nome),

            descricao:
                nameInput.dataset.descricao ||
                "",

            criadoEm:
                new Date().toISOString()
        });


        saveExerciciosPersonalizados();
    }


    const t =
        treinoAtual();

    const now =
        Date.now();


    const reg = {

        id: now,

        data:
            formatarData(),

        tipo,

        series:
            seriesData.length,

        seriesData
    };


    t.exercicios.push({

        id: now,

        nome,

        grupo,

        tipo,

        personalizado:
            personal,

        series:
            seriesData.length,

        seriesData,

        historico: [
            reg
        ]
    });


    save();

    renderTreino();
}


/* =========================================================
   EDITAR EXERCÍCIO
   ========================================================= */

function abrirEditorExercicio(
    exercicio
) {

    if (!exercicio) {
        return;
    }


    document
        .getElementById(
            "exerciseEditorOverlay"
        )
        ?.remove();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "exercise-editor-overlay open";

    overlay.id =
        "exerciseEditorOverlay";


    const tipo =
        exercicio.tipo ||
        inferirTipoExercicio(
            exercicio.nome,
            exercicio.grupo
        );


    const count =
        numeroSeriesExercicio(
            exercicio
        );


    overlay.innerHTML = `

        <div
            class="exercise-editor"
            role="dialog"
            aria-modal="true"
        >

            <div class="exercise-editor-top">

                <div>

                    <span class="eyebrow">
                        ATUALIZAR EXERCÍCIO
                    </span>

                    <h2>
                        ${escapeHtml(
                            exercicio.nome
                        )}
                    </h2>

                    <p class="muted">
                        Atualiza cada série individualmente.
                        A alteração será guardada como nova evolução.
                    </p>

                </div>


                <button
                    class="exercise-picker-close"
                    id="closeExerciseEditor"
                    aria-label="Fechar"
                >
                    ×
                </button>

            </div>


            <div
                class="series-setup editor-series-setup"
            >

                <div class="series-count-row">

                    <div>

                        <label for="editorSeriesCount">
                            Número de séries
                        </label>

                        <small>
                            Podes aumentar ou reduzir
                            o número de séries nesta atualização.
                        </small>

                    </div>

                    <input
                        id="editorSeriesCount"
                        class="input series-count-input"
                        type="number"
                        min="1"
                        max="30"
                        value="${count}"
                    >

                </div>

            </div>


            <div
                id="exerciseEditorFields"
                class="adaptive-exercise-fields"
            ></div>


            <button
                class="primary-btn full"
                id="saveExerciseEdition"
            >
                Guardar atualização
            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    renderLinhasSeries(
        document.getElementById(
            "exerciseEditorFields"
        ),
        exercicio,
        count
    );


    document.getElementById(
        "editorSeriesCount"
    ).addEventListener(
        "change",
        () => {

            renderLinhasSeries(
                document.getElementById(
                    "exerciseEditorFields"
                ),
                exercicio,
                Number(
                    document.getElementById(
                        "editorSeriesCount"
                    ).value
                ) || 1
            );
        }
    );


    document.getElementById(
        "closeExerciseEditor"
    ).onclick =
        () =>
            overlay.remove();


    overlay.addEventListener(
        "click",
        e => {

            if (
                e.target === overlay
            ) {
                overlay.remove();
            }
        }
    );


    document.getElementById(
        "saveExerciseEdition"
    ).onclick =
        () =>
            guardarAtualizacaoExercicio(
                exercicio
            );
}


/* =========================================================
   GUARDAR ATUALIZAÇÃO
   ========================================================= */

function guardarAtualizacaoExercicio(
    exercicio
) {

    const tipo =
        exercicio.tipo ||
        inferirTipoExercicio(
            exercicio.nome,
            exercicio.grupo
        );


    const seriesData =
        recolherSeries(
            document.getElementById(
                "exerciseEditorFields"
            ),
            tipo
        );


    const err =
        validarSeries(
            tipo,
            seriesData
        );


    if (err) {
        return alert(err);
    }


    const reg = {

        id:
            Date.now(),

        data:
            formatarData(),

        tipo,

        series:
            seriesData.length,

        seriesData
    };


    const historico =
        Array.isArray(
            exercicio.historico
        )
            ? exercicio.historico
            : [];


    historico.push(
        reg
    );


    exercicio.historico =
        historico;


    exercicio.series =
        seriesData.length;


    exercicio.seriesData =
        seriesData;


    Object.keys(
        PARAMETROS
    ).forEach(
        p => {

            if (p !== "series") {
                delete exercicio[p];
            }
        }
    );


    Object.assign(
        exercicio,
        {
            tipo
        }
    );


    save();


    document
        .getElementById(
            "exerciseEditorOverlay"
        )
        ?.remove();


    renderTreino();
}


/* =========================================================
   PROGRESSÃO
   ========================================================= */

function mostrarProgressao(
    exercicio
) {

    if (!exercicio) {
        return;
    }


    document
        .getElementById(
            "progressOverlay"
        )
        ?.remove();


    const tipo =
        exercicio.tipo ||
        inferirTipoExercicio(
            exercicio.nome,
            exercicio.grupo
        );


    const h =
        Array.isArray(
            exercicio.historico
        )
            ? exercicio.historico
            : [];


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "progress-overlay open";

    overlay.id =
        "progressOverlay";


    const historyHtml =
        h.length

            ? h
                  .map(
                      row => {

                          const series =
                              historicoComSeries(
                                  exercicio,
                                  row
                              );

                          return `
                              <article class="progress-history-entry">

                                  <div class="progress-history-date">
                                      ${escapeHtml(
                                          row.data ||
                                          "—"
                                      )}
                                  </div>

                                  <div class="progress-history-series">

                                      ${series
                                          .map(
                                              (s, i) => `

                                                  <div class="progress-history-series-row">

                                                      <span>
                                                          Série ${i + 1}
                                                      </span>

                                                      <strong>
                                                          ${escapeHtml(
                                                              serieResumo(
                                                                  tipo,
                                                                  s
                                                              ) ||
                                                              "Sem valores"
                                                          )}
                                                      </strong>

                                                  </div>

                                              `
                                          )
                                          .join("")}

                                  </div>

                              </article>
                          `;
                      }
                  )
                  .join("")

            : `
                <div class="progress-empty">

                    <strong>
                        Ainda não existe histórico.
                    </strong>

                    <p>
                        As atualizações guardadas
                        neste exercício aparecerão aqui.
                    </p>

                </div>
            `;


    overlay.innerHTML = `

        <div
            class="progress-modal"
            role="dialog"
            aria-modal="true"
        >

            <div class="exercise-editor-top">

                <div>

                    <span class="eyebrow">
                        PROGRESSÃO
                    </span>

                    <h2>
                        ${escapeHtml(
                            exercicio.nome
                        )}
                    </h2>

                    <p class="muted">
                        Histórico de evolução · apenas consulta
                    </p>

                </div>


                <button
                    class="exercise-picker-close"
                    id="closeProgress"
                    aria-label="Fechar"
                >
                    ×
                </button>

            </div>


            <div class="progress-history-list">

                ${historyHtml}

            </div>


            <div class="progress-readonly-note">

                🔒 Consulta apenas.
                Para registar novos valores,
                utiliza o botão
                <strong>
                    Atualizar
                </strong>
                no exercício.

            </div>


            <div class="progress-actions">

                <button
                    class="secondary-btn"
                    id="closeProgressBottom"
                >
                    Fechar
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    document.getElementById(
        "closeProgress"
    ).onclick =
        () =>
            overlay.remove();


    document.getElementById(
        "closeProgressBottom"
    ).onclick =
        () =>
            overlay.remove();


    overlay.addEventListener(
        "click",
        e => {

            if (
                e.target === overlay
            ) {
                overlay.remove();
            }
        }
    );
}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    renderTreino
);