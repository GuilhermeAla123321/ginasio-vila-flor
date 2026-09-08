const STORAGE_TREINOS="vf_ginasio_treinos_v2";
const STORAGE_EXERCICIOS_PERSONALIZADOS="vf_ginasio_exercicios_personalizados_v1";
const diasSemana=[
 ["segunda","SEG","Segunda-feira"],["terca","TER","Terça-feira"],["quarta","QUA","Quarta-feira"],
 ["quinta","QUI","Quinta-feira"],["sexta","SEX","Sexta-feira"],["sabado","SÁB","Sábado"],["domingo","DOM","Domingo"]
];

// Biblioteca existente: nomes preservados para manter compatibilidade com os dados atuais.
const exerciciosDisponiveis=["Supino Plano","Supino Inclinado","Aberturas com Halteres","Press de Peito","Puxada Frontal","Remada Sentada","Remada com Halteres","Elevação Lateral","Press de Ombros","Curl de Bíceps","Curl Martelo","Tríceps na Polia","Agachamento","Leg Press","Extensão de Pernas","Flexão de Pernas","Peso Livre","Máquina Abdutora","Máquina Adutora","Passadeira","Bicicleta","Elíptica","Máquina de Remo"];

const TIPOS_EXERCICIO={
 musculacao:{label:"Musculação",params:["carga","series","repeticoes"]},
 halteres:{label:"Musculação · Halteres",params:["pesoHalter","series","repeticoes"]},
 cardio:{label:"Cardio",params:["resistencia","velocidade","tempo","distancia","series"]},
 passadeira:{label:"Cardio · Passadeira",params:["velocidade","inclinacao","tempo","series"]},
 remo:{label:"Cardio · Remo",params:["resistencia","tempo","distancia","ritmo","series"]},
 pesoCorporal:{label:"Peso corporal",params:["series","repeticoes","tempo"]},
 isometrico:{label:"Isométrico",params:["tempo","series"]},
 mobilidade:{label:"Mobilidade/Flexibilidade",params:["tempo","series"]},
 outro:{label:"Outro",params:["carga","series","repeticoes","tempo","velocidade","inclinacao","distancia","resistencia","ritmo"]}
};

const PARAMETROS={
 carga:{label:"Carga",unit:"kg",step:"0.5",placeholder:"60"},
 pesoHalter:{label:"Peso por halter",unit:"kg",step:"0.5",placeholder:"12"},
 series:{label:"Séries",unit:"",step:"1",placeholder:"4"},
 repeticoes:{label:"Repetições",unit:"",step:"1",placeholder:"10"},
 tempo:{label:"Tempo",unit:"min",step:"0.5",placeholder:"20"},
 velocidade:{label:"Velocidade",unit:"km/h",step:"0.1",placeholder:"10"},
 inclinacao:{label:"Inclinação",unit:"%",step:"0.5",placeholder:"5"},
 distancia:{label:"Distância",unit:"km",step:"0.01",placeholder:"5"},
 resistencia:{label:"Resistência",unit:"",step:"1",placeholder:"5"},
 ritmo:{label:"Ritmo",unit:"min/500m",step:"0.1",placeholder:"2.5"}
};

let treinos=carregarJSON(STORAGE_TREINOS,{}),
    exerciciosPersonalizados=carregarJSON(STORAGE_EXERCICIOS_PERSONALIZADOS,[]),
    diaSelecionado="segunda";

function carregarJSON(chave,valorPadrao){
 try{const raw=localStorage.getItem(chave);if(!raw)return valorPadrao;return JSON.parse(raw)??valorPadrao}
 catch(e){console.warn(`Não foi possível ler ${chave}:`,e);return valorPadrao}
}
function save(){try{localStorage.setItem(STORAGE_TREINOS,JSON.stringify(treinos))}catch(e){console.warn("Treinos localStorage:",e)}}
function saveExerciciosPersonalizados(){try{localStorage.setItem(STORAGE_EXERCICIOS_PERSONALIZADOS,JSON.stringify(exerciciosPersonalizados))}catch(e){console.warn("Exercícios personalizados localStorage:",e)}}
function treinoAtual(){if(!treinos[diaSelecionado])treinos[diaSelecionado]={nome:"Treino",exercicios:[]};return treinos[diaSelecionado]}
function normalizarTexto(valor){return String(valor||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim()}
function escaparAtributo(s){return escapeHtml(s).replace(/`/g,"&#96;")}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}

function inferirTipoExercicio(nome,grupo=""){
 const n=normalizarTexto(nome);
 if(/passadeira|treadmill/.test(n))return "passadeira";
 if(/bicicleta|bike|bicycle/.test(n))return "cardio";
 if(/eliptica|elliptical/.test(n))return "cardio";
 if(/remo|rowing|ergometro/.test(n))return "remo";
 if(/prancha|isometr/.test(n))return "isometrico";
 if(/alongamento|mobilidade|stretch|flexibilidade/.test(n))return "mobilidade";
 if(/flexao|flexoes|push up|push-up/.test(n))return "pesoCorporal";
 if(/barras|barra fixa|triceps no banco|fundos|dips/.test(n)&&!/polia/.test(n))return "pesoCorporal";
 if(/halteres|halter|dumbbell/.test(n))return "halteres";
 if(grupo==="Core"&&/prancha/.test(n))return "isometrico";
 if(/cardio/.test(normalizarTexto(grupo)))return "cardio";
 return "musculacao";
}

function inferirGrupoExercicio(nome){
 const n=normalizarTexto(nome);
 if(/supino|peito|crucifixo|abertura|press de peito|voador/.test(n))return "Peito";
 if(/costas|puxada|remada|pulldown|pull up|barra fixa/.test(n))return "Costas";
 if(/perna|agachamento|leg press|quadric|femoral|glute|abdutora|adutora|panturrilha|peso morto|deadlift/.test(n))return "Pernas";
 if(/ombro|elevacao lateral|elevacao frontal|militar|press de ombro/.test(n))return "Ombros";
 if(/bicep|biceps|tricep|triceps|braco|curl|rosca|polia/.test(n))return "Braços";
 if(/abdom|core|prancha|crunch|lombar/.test(n))return "Core";
 if(/passadeira|bicicleta|eliptica|remo|cardio/.test(n))return "Cardio";
 return "Outro";
}

function metadadosExercicio(nome,meta={}){
 const grupo=meta.grupo||inferirGrupoExercicio(nome);
 return {nome,grupo,tipo:meta.tipo||inferirTipoExercicio(nome,grupo),personalizado:!!meta.personalizado,id:meta.id||null};
}

function construirBibliotecaExercicios(){
 const mapa=new Map();
 exerciciosDisponiveis.forEach(nome=>mapa.set(normalizarTexto(nome),metadadosExercicio(nome)));
 if(Array.isArray(window.exerciciosAjuda))window.exerciciosAjuda.forEach(item=>{if(item?.nome)mapa.set(normalizarTexto(item.nome),metadadosExercicio(item.nome,{grupo:item.grupo}))});
 if(Array.isArray(exerciciosPersonalizados))exerciciosPersonalizados.forEach(item=>{if(item?.nome)mapa.set(normalizarTexto(item.nome),metadadosExercicio(item.nome,{grupo:item.grupo,tipo:item.tipo,personalizado:true,id:item.id}))});
 return [...mapa.values()];
}
function pesquisarExercicios(termo){
 const q=normalizarTexto(termo);
 const sinonimos={bicep:["biceps","bracos","curl","rosca"],biceps:["biceps","bracos","curl","rosca"],tricep:["triceps","bracos","polia"],triceps:["triceps","bracos","polia"],perna:["pernas","agachamento","leg press"],pernas:["pernas","agachamento","leg press"],peito:["peito","supino","crucifixo","abertura"],costas:["costas","remada","puxada"],ombro:["ombros","elevacao","press"],ombros:["ombros","elevacao","press"],abdominais:["core","abdom","prancha"],abdominal:["core","abdom","prancha"],abs:["core","abdom","prancha"]};
 if(!q)return construirBibliotecaExercicios();
 const tokens=q.split(" ").filter(Boolean);
 const extras=sinonimos[q]||[];
 return construirBibliotecaExercicios().filter(item=>{
  const hay=normalizarTexto(`${item.nome} ${item.grupo} ${TIPOS_EXERCICIO[item.tipo]?.label||""}`);
  return tokens.every(t=>hay.includes(t))||hay.includes(q)||extras.some(token=>hay.includes(normalizarTexto(token)));
 });
}

function normalizarDadosHistorico(registro,exercicio){
 const base={...(registro||{})};
 const tipo=exercicio.tipo||inferirTipoExercicio(exercicio.nome,exercicio.grupo);
 // Compatibilidade com o formato antigo peso/series/reps.
 if(base.carga==null&&base.peso!=null)base.carga=base.peso;
 if(base.repeticoes==null&&base.reps!=null)base.repeticoes=base.reps;
 if(base.series==null&&base.series!=null)base.series=base.series;
 base.tipo=base.tipo||tipo;
 return base;
}
function ultimoRegisto(x){
 const h=Array.isArray(x.historico)?x.historico:[];
 return h.length?normalizarDadosHistorico(h[h.length-1],x):normalizarDadosHistorico(x,x);
}
function valorAtual(x,param){const u=ultimoRegisto(x);return u[param]!=null?u[param]:x[param]!=null?x[param]:""}
function formatarData(){return new Date().toLocaleDateString("pt-PT")}
function formatarValor(param,val){if(val==null||val==="")return "—";return `${escapeHtml(val)}${PARAMETROS[param]?.unit?` ${PARAMETROS[param].unit}`:""}`}
function resumoRegisto(x){
 const meta=metadadosExercicio(x.nome,{grupo:x.grupo,tipo:x.tipo,personalizado:x.personalizado});
 return meta.tipo?TIPOS_EXERCICIO[meta.tipo].params.map(p=>formatarValor(p,valorAtual(x,p))).filter(v=>v!=="—").join(" · "):"";
}

function renderTreino(){
 const r=document.getElementById("workout-root");if(!r)return;
 const t=treinos[diaSelecionado]||{nome:"Treino",exercicios:[]};
 const d=diasSemana.find(x=>x[0]===diaSelecionado)||diasSemana[0];
 r.innerHTML=`<div class="days-selector">${diasSemana.map(x=>`<button class="day-button ${x[0]===diaSelecionado?"active":""}" data-day="${x[0]}"><strong>${x[1]}</strong><span>${treinos[x[0]]?.exercicios?.length||""}</span></button>`).join("")}</div>
 <div class="selected-day"><div><span class="eyebrow">DIA SELECIONADO</span><h3>${d[2]}</h3></div><button class="edit-workout-btn" id="editWorkoutName">Editar nome</button></div>
 <div class="workout-name-card"><strong>${escapeHtml(t.nome||"Treino")}</strong><span>${t.exercicios.length} exercício(s)</span></div>
 <div class="exercise-list">${t.exercicios.length?t.exercicios.map((x,i)=>renderExercicioCard(x,i)).join(""):`<div class="empty-workout"><strong>Este dia ainda não tem exercícios</strong><p>Adiciona vários exercícios para construir o teu treino.</p></div>`}</div>
 <button class="add-exercise-main" id="addExercise">+ Adicionar exercício</button>`;
 document.querySelectorAll(".day-button").forEach(b=>b.onclick=()=>{diaSelecionado=b.dataset.day;renderTreino()});
 document.getElementById("addExercise").onclick=abrirAdicionar;
 document.getElementById("editWorkoutName").onclick=()=>{const n=prompt("Nome do treino:",t.nome);if(n?.trim()){t.nome=n.trim();save();renderTreino()}};
 document.querySelectorAll(".delete-exercise").forEach(b=>b.onclick=()=>{t.exercicios.splice(Number(b.dataset.index),1);save();renderTreino()});
 document.querySelectorAll(".progress-button").forEach(b=>b.onclick=()=>mostrarProgressao(t.exercicios[Number(b.dataset.index)]));
 document.querySelectorAll(".update-exercise-button").forEach(b=>b.onclick=()=>abrirEditorExercicio(t.exercicios[Number(b.dataset.index)]));
}

function renderExercicioCard(x,i){
 const meta=metadadosExercicio(x.nome,{grupo:x.grupo,tipo:x.tipo,personalizado:x.personalizado});
 const tipoLabel=TIPOS_EXERCICIO[meta.tipo]?.label||"Outro";
 const params=TIPOS_EXERCICIO[meta.tipo]?.params||TIPOS_EXERCICIO.outro.params;
 const destaque=params.slice(0,3).map(p=>{const v=valorAtual(x,p);return v!==""?`${PARAMETROS[p].label}: ${formatarValor(p,v)}`:null}).filter(Boolean).join(" · ");
 return `<article class="exercise-card"><div class="exercise-top"><div class="exercise-number">${String(i+1).padStart(2,"0")}</div><div class="exercise-info"><strong>${escapeHtml(x.nome)}</strong><span>${escapeHtml(tipoLabel)}${meta.personalizado?" · Personalizado":""}</span></div><button class="delete-exercise" data-index="${i}" aria-label="Remover exercício">×</button></div><div class="exercise-stats adaptive-stats"><div><small>${escapeHtml(PARAMETROS[params[0]]?.label||"")}</small><strong>${formatarValor(params[0],valorAtual(x,params[0]))}</strong></div><div><small>${escapeHtml(PARAMETROS[params[1]]?.label||"")}</small><strong>${formatarValor(params[1],valorAtual(x,params[1]))}</strong></div>${params[2]?`<div><small>${escapeHtml(PARAMETROS[params[2]]?.label||"")}</small><strong>${formatarValor(params[2],valorAtual(x,params[2]))}</strong></div>`:""}</div><div class="exercise-card-summary">${destaque}</div><div class="exercise-card-actions"><button class="secondary-btn update-exercise-button" data-index="${i}">🔵 Atualizar</button><button class="progress-button" data-index="${i}">🟣 Ver progressão →</button></div></article>`;
}

function abrirAdicionar(){
 const r=document.getElementById("workout-root");
 r.innerHTML=`<button class="back-button" id="backWorkout">← Voltar</button><div class="workout-header"><span class="eyebrow">NOVO EXERCÍCIO</span><h2>Adicionar exercício</h2><p class="muted">${diasSemana.find(x=>x[0]===diaSelecionado)?.[2]||""}</p></div>
 <div class="form-card workout-add-form"><label>Exercício</label><div class="exercise-picker-trigger-wrap"><input id="exerciseName" class="input exercise-name-input" type="text" placeholder="Selecionar exercício" readonly><button type="button" class="exercise-picker-trigger" id="openExercisePicker"><span>⌕</span> Escolher exercício</button></div><div class="exercise-selection-hint" id="exerciseSelectionHint">Procura um exercício existente ou cria um novo.</div><div id="exerciseTypeWrap"></div><div id="exerciseFields" class="adaptive-exercise-fields"></div><button class="primary-btn full" id="saveExercise">Adicionar ao treino</button></div>`;
 document.getElementById("backWorkout").onclick=renderTreino;
 document.getElementById("openExercisePicker").onclick=abrirSeletorExercicio;
 document.getElementById("saveExercise").onclick=guardarExercicio;
 requestAnimationFrame(abrirSeletorExercicio);
}

function abrirSeletorExercicio(){
 fecharSeletorExercicio();
 const overlay=document.createElement("div");overlay.className="exercise-picker-overlay open";overlay.id="exercisePickerOverlay";
 overlay.innerHTML=`<div class="exercise-picker" role="dialog" aria-modal="true"><div class="exercise-picker-handle"></div><div class="exercise-picker-header"><div><span class="eyebrow">BIBLIOTECA DE EXERCÍCIOS</span><h2>Adicionar exercício</h2></div><button type="button" class="exercise-picker-close" id="closeExercisePicker">×</button></div><div class="exercise-search-wrap"><span class="exercise-search-icon">⌕</span><input id="exerciseSearch" class="exercise-search-input" type="search" placeholder="Procurar exercício..." autocomplete="off" spellcheck="false"></div><div class="exercise-search-meta" id="exerciseSearchMeta"></div><div class="exercise-search-results" id="exerciseSearchResults"></div></div>`;
 document.body.appendChild(overlay);
 const input=document.getElementById("exerciseSearch");
 const render=()=>renderResultadosPesquisa(input.value);
 input.addEventListener("input",render);document.getElementById("closeExercisePicker").onclick=fecharSeletorExercicio;overlay.addEventListener("click",e=>{if(e.target===overlay)fecharSeletorExercicio()});
 document.addEventListener("keydown",fecharSeletorPorTecla);render();requestAnimationFrame(()=>input.focus());
}
function fecharSeletorPorTecla(e){if(e.key==="Escape")fecharSeletorExercicio()}
function fecharSeletorExercicio(){document.getElementById("exercisePickerOverlay")?.remove();document.removeEventListener("keydown",fecharSeletorPorTecla)}
function renderResultadosPesquisa(termo){
 const results=document.getElementById("exerciseSearchResults"),meta=document.getElementById("exerciseSearchMeta");if(!results)return;
 const lista=pesquisarExercicios(termo),q=String(termo||"").trim();if(meta)meta.textContent=q?`${lista.length} resultado(s)`:`${lista.length} exercícios disponíveis`;
 const customCta=q?`<div class="exercise-search-custom-row"><div><strong>Queres adicionar um exercício próprio?</strong><span>Escreve qualquer nome e define o tipo e os parâmetros no passo seguinte.</span></div><button type="button" class="custom-exercise-btn" id="createCustomExercise">+ Adicionar "${escapeHtml(q)}"</button></div>`:`<div class="exercise-search-custom-row exercise-search-custom-row-empty"><div><strong>Não encontras o que procuras?</strong><span>Podes escrever manualmente o nome de qualquer exercício e criá-lo.</span></div><button type="button" class="custom-exercise-btn" id="createCustomExercise">+ Adicionar exercício personalizado</button></div>`;
 const listaHtml=lista.map(item=>`<button type="button" class="exercise-search-result" data-exercise-name="${escaparAtributo(item.nome)}"><span class="exercise-search-result-icon">${item.personalizado?"✦":"＋"}</span><span class="exercise-search-result-copy"><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(item.grupo)} · ${escapeHtml(TIPOS_EXERCICIO[item.tipo]?.label||"Outro")}${item.personalizado?" · Personalizado":""}</small></span><span class="exercise-search-result-arrow">›</span></button>`).join("");
 results.innerHTML=(lista.length?listaHtml:`<div class="exercise-search-empty"><div class="exercise-search-empty-icon">⌕</div><strong>${q?"Não encontrámos este exercício.":"Pesquisa um exercício ou cria um novo."}</strong><p>${q?"Podes adicioná-lo ao teu treino e escolher o tipo mais adequado.":"Escreve o nome na caixa acima para procurar ou criar um exercício."}</p></div>`)+customCta;
 document.getElementById("createCustomExercise")?.addEventListener("click",()=>{const nome=(document.getElementById("exerciseSearch")?.value||"").trim();if(!nome){document.getElementById("exerciseSearch")?.focus();const m=document.getElementById("exerciseSearchMeta");if(m)m.textContent="Escreve primeiro o nome do novo exercício.";return;}selecionarExercicio(nome,true)});
 results.querySelectorAll("[data-exercise-name]").forEach(btn=>btn.onclick=()=>{const item=construirBibliotecaExercicios().find(x=>normalizarTexto(x.nome)===normalizarTexto(btn.dataset.exerciseName));selecionarExercicio(item?.nome||btn.dataset.exerciseName,!!item?.personalizado,item)});
}
function selecionarExercicio(nome,personalizado=false,item=null){
 const input=document.getElementById("exerciseName");if(!input)return;
 input.value=nome;input.dataset.personalizado=personalizado?"true":"false";input.dataset.tipo=item?.tipo||inferirTipoExercicio(nome,item?.grupo);input.dataset.grupo=item?.grupo||inferirGrupoExercicio(nome);
 const hint=document.getElementById("exerciseSelectionHint");if(hint)hint.innerHTML=personalizado?`<span class="custom-selected-badge">✦ Exercício personalizado</span> Escolhe o tipo abaixo.`:`<span class="existing-selected-badge">✓ Exercício selecionado</span> ${escapeHtml(item?.grupo||inferirGrupoExercicio(nome))}`;
 fecharSeletorExercicio();renderFormularioExercicio(document.getElementById("exerciseFields"),{nome,tipo:input.dataset.tipo,grupo:input.dataset.grupo});
}

function renderFormularioExercicio(container,exercicio,modo="add"){
 if(!container)return;
 const tipoVal=exercicio?.tipo||inferirTipoExercicio(exercicio?.nome||"",exercicio?.grupo||"");
 const params=TIPOS_EXERCICIO[tipoVal]?.params||TIPOS_EXERCICIO.outro.params;
 let typeHtml="";
 if(modo!=="fixed") typeHtml=`<div class="exercise-type-block"><label for="exerciseType">Tipo de exercício</label><select id="exerciseType" class="input">${Object.entries(TIPOS_EXERCICIO).map(([key,v])=>`<option value="${key}" ${key===tipoVal?"selected":""}>${v.label}</option>`).join("")}</select></div>`;
 container.innerHTML=`${typeHtml}<div class="form-row adaptive-fields-grid">${params.map(p=>{const cfg=PARAMETROS[p];const val=exercicio?valorAtual(exercicio,p):"";return `<div class="adaptive-field"><label for="field_${p}">${cfg.label}${cfg.unit?` <span>(${cfg.unit})</span>`:""}</label><input id="field_${p}" data-param="${p}" class="input" type="number" min="0" step="${cfg.step}" placeholder="${cfg.placeholder}" value="${val!==""?escapeHtml(val):""}"></div>`}).join("")}</div>`;
 const select=document.getElementById("exerciseType");select?.addEventListener("change",()=>{exercicio.tipo=select.value;renderFormularioExercicio(container,exercicio,modo)});
}
function recolherParametros(container){
 const out={};container?.querySelectorAll("[data-param]").forEach(input=>{if(input.value!=="")out[input.dataset.param]=Number(input.value)});return out;
}
function validarParametros(tipo,values){
 const params=TIPOS_EXERCICIO[tipo]?.params||[];
 const required=params.filter(p=>p!=="carga"&&p!=="pesoHalter"&&p!=="resistencia"&&p!=="velocidade"&&p!=="inclinacao"&&p!=="distancia"&&p!=="ritmo"||values[p]!==undefined);
 // Séries é o único campo obrigatório em praticamente todos os tipos estruturados; os restantes podem ser complementados mais tarde.
 if((params.includes("series")&&(!Number.isFinite(values.series)||values.series<1)))return "Indica um número válido de séries.";
 const numeric=Object.entries(values).some(([,v])=>!Number.isFinite(v)||v<0);if(numeric)return "Verifica os valores introduzidos.";
 if(params.includes("repeticoes")&&values.repeticoes!=null&&values.repeticoes<1)return "As repetições devem ser pelo menos 1.";
 return null;
}
function guardarExercicio(){
 const nameInput=document.getElementById("exerciseName"),container=document.getElementById("exerciseFields");const nome=nameInput?.value.trim();if(!nome)return alert("Escolhe um exercício.");
 const tipo=document.getElementById("exerciseType")?.value||nameInput.dataset.tipo||inferirTipoExercicio(nome,nameInput.dataset.grupo);
 const grupo=nameInput.dataset.grupo||inferirGrupoExercicio(nome);const values=recolherParametros(container);const error=validarParametros(tipo,values);if(error)return alert(error);
 const personal=nameInput.dataset.personalizado==="true";if(personal&&!exerciciosPersonalizados.some(x=>normalizarTexto(x.nome)===normalizarTexto(nome))){exerciciosPersonalizados.push({id:`custom-${Date.now()}`,nome,grupo,tipo,criadoEm:new Date().toISOString()});saveExerciciosPersonalizados()}
 const t=treinoAtual();const now=Date.now();const reg={id:now,data:formatarData(),tipo,...values};t.exercicios.push({id:now,nome,grupo,tipo,personalizado:personal,...values,historico:[reg]});save();renderTreino();
}

function abrirEditorExercicio(exercicio){
 if(!exercicio)return;
 const existing=document.getElementById("exerciseEditorOverlay");existing?.remove();
 const base=ultimoRegisto(exercicio);
 const overlay=document.createElement("div");overlay.className="exercise-editor-overlay open";overlay.id="exerciseEditorOverlay";
 overlay.innerHTML=`<div class="exercise-editor" role="dialog" aria-modal="true"><div class="exercise-editor-top"><div><span class="eyebrow">ATUALIZAR EXERCÍCIO</span><h2>${escapeHtml(exercicio.nome)}</h2><p class="muted">${escapeHtml(TIPOS_EXERCICIO[exercicio.tipo]?.label||"Outro")} · a alteração será guardada como nova evolução</p></div><button class="exercise-picker-close" id="closeExerciseEditor" aria-label="Fechar">×</button></div><div id="exerciseEditorFields" class="adaptive-exercise-fields"></div><button class="primary-btn full" id="saveExerciseEdition">Guardar atualização</button></div>`;
 document.body.appendChild(overlay);renderFormularioExercicio(document.getElementById("exerciseEditorFields"),base,"fixed");document.getElementById("closeExerciseEditor").onclick=()=>overlay.remove();overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove()});
 document.getElementById("saveExerciseEdition").onclick=()=>guardarAtualizacaoExercicio(exercicio);
}
function guardarAtualizacaoExercicio(exercicio){
 const tipo=exercicio.tipo||inferirTipoExercicio(exercicio.nome,exercicio.grupo);const values=recolherParametros(document.getElementById("exerciseEditorFields"));const err=validarParametros(tipo,values);if(err)return alert(err);
 const historico=Array.isArray(exercicio.historico)?exercicio.historico:[];
 const reg={id:Date.now(),data:formatarData(),tipo,...values};
 historico.push(reg);
 exercicio.historico=historico;
 Object.assign(exercicio,values,{tipo});
 save();document.getElementById("exerciseEditorOverlay")?.remove();renderTreino();
}

function mostrarProgressao(exercicio){
 if(!exercicio)return;document.getElementById("progressOverlay")?.remove();
 const tipo=exercicio.tipo||inferirTipoExercicio(exercicio.nome,exercicio.grupo);const params=TIPOS_EXERCICIO[tipo]?.params||TIPOS_EXERCICIO.outro.params;const h=Array.isArray(exercicio.historico)?exercicio.historico:[];
 const overlay=document.createElement("div");overlay.className="progress-overlay open";overlay.id="progressOverlay";
 overlay.innerHTML=`<div class="progress-modal" role="dialog" aria-modal="true"><div class="exercise-editor-top"><div><span class="eyebrow">PROGRESSÃO</span><h2>${escapeHtml(exercicio.nome)}</h2><p class="muted">${escapeHtml(TIPOS_EXERCICIO[tipo]?.label||"Outro")} · histórico de evolução</p></div><button class="exercise-picker-close" id="closeProgress" aria-label="Fechar">×</button></div>${h.length?`<div class="progress-table-wrap"><table class="progress-table"><thead><tr><th>Data</th>${params.map(p=>`<th>${escapeHtml(PARAMETROS[p].label)}</th>`).join("")}</tr></thead><tbody>${h.map(row=>{const d=normalizarDadosHistorico(row,exercicio);return `<tr><td>${escapeHtml(d.data||"—")}</td>${params.map(p=>`<td>${formatarValor(p,d[p])}</td>`).join("")}</tr>`}).join("")}</tbody></table></div>`:`<div class="progress-empty"><strong>Ainda não existe histórico.</strong><p>As atualizações guardadas neste exercício aparecerão aqui.</p></div>`}<div class="progress-readonly-note">🔒 Consulta apenas — as alterações são feitas através do botão <strong>Atualizar</strong>.</div><div class="progress-actions"><button class="secondary-btn" id="closeProgressBottom">Fechar</button></div></div>`;
 document.body.appendChild(overlay);document.getElementById("closeProgress").onclick=()=>overlay.remove();document.getElementById("closeProgressBottom").onclick=()=>overlay.remove();overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove()});
}

document.addEventListener("DOMContentLoaded",renderTreino);
