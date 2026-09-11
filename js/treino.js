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
 if(Array.isArray(window.exerciciosBiblioteca))window.exerciciosBiblioteca.forEach(item=>{if(item?.nome)mapa.set(normalizarTexto(item.nome),metadadosExercicio(item.nome,{grupo:item.grupo}))});
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


function numeroSeriesExercicio(exercicio){
 const arr=Array.isArray(exercicio?.seriesData)?exercicio.seriesData:[];
 if(arr.length)return arr.length;
 const n=Number(exercicio?.series);
 return Number.isFinite(n)&&n>0?Math.floor(n):1;
}
function extrairSeriesExercicio(exercicio){
 const tipo=exercicio?.tipo||inferirTipoExercicio(exercicio?.nome||"",exercicio?.grupo||"");
 const params=(TIPOS_EXERCICIO[tipo]?.params||TIPOS_EXERCICIO.outro.params).filter(p=>p!=="series");
 if(Array.isArray(exercicio?.seriesData)&&exercicio.seriesData.length){
  return exercicio.seriesData.map(s=>Object.fromEntries(params.map(p=>[p,s?.[p]??""])));
 }
 const n=numeroSeriesExercicio(exercicio);
 return Array.from({length:n},()=>Object.fromEntries(params.map(p=>[p,exercicio?.[p]??valorAtual(exercicio,p)??""])));
}
function validarSeries(tipo,seriesData){
 const params=(TIPOS_EXERCICIO[tipo]?.params||TIPOS_EXERCICIO.outro.params).filter(p=>p!=="series");
 if(!Array.isArray(seriesData)||!seriesData.length)return "Indica pelo menos uma série.";
 for(const serie of seriesData){
  let temValor=false;
  for(const p of params){
   if(serie[p]!==undefined&&serie[p]!==""){
    temValor=true;
    if(!Number.isFinite(Number(serie[p])))return `Verifica o valor de ${PARAMETROS[p]?.label||p}.`;
    if(Number(serie[p])<0)return "Os valores não podem ser negativos.";
   }
  }
  if(!temValor)return "Preenche pelo menos um valor em cada série.";
  if(params.includes("repeticoes")&&serie.repeticoes!==""&&serie.repeticoes!=null&&Number(serie.repeticoes)<1)return "As repetições devem ser pelo menos 1.";
 }
 return null;
}
function renderLinhasSeries(container, exercicio, seriesCount){
 if(!container)return;
 const tipo=exercicio?.tipo||inferirTipoExercicio(exercicio?.nome||"",exercicio?.grupo||"");
 const params=(TIPOS_EXERCICIO[tipo]?.params||TIPOS_EXERCICIO.outro.params).filter(p=>p!=="series");
 const existing=Array.isArray(exercicio?.seriesData)&&exercicio.seriesData.length?exercicio.seriesData:extrairSeriesExercicio(exercicio||{});
 const count=Math.max(1,Math.min(30,Number(seriesCount)||1));
 container.innerHTML=Array.from({length:count},(_,i)=>{
   const serie=existing[i]||{};
   return `<div class="set-entry-card"><div class="set-entry-title"><span>SÉRIE ${i+1}</span><small>Valores independentes</small></div><div class="set-entry-fields">${params.map(p=>{const cfg=PARAMETROS[p];const val=serie[p]??"";return `<div class="adaptive-field"><label for="series_${i}_${p}">${cfg.label}${cfg.unit?` <span>(${cfg.unit})</span>`:""}</label><input id="series_${i}_${p}" data-series-index="${i}" data-param="${p}" class="input series-value-input" type="number" min="0" step="${cfg.step}" placeholder="${cfg.placeholder}" value="${val!==""?escapeHtml(val):""}"></div>`}).join("")}</div></div>`;
 }).join("");
}
function recolherSeries(container,tipo){
 const params=(TIPOS_EXERCICIO[tipo]?.params||TIPOS_EXERCICIO.outro.params).filter(p=>p!=="series");
 const count=[...new Set([...container.querySelectorAll("[data-series-index]")].map(el=>Number(el.dataset.seriesIndex)))].length;
 return Array.from({length:count},(_,i)=>Object.fromEntries(params.map(p=>{const input=container.querySelector(`[data-series-index="${i}"][data-param="${p}"]`);return [p,input&&input.value!==""?Number(input.value):""]})));
}
function serieResumo(tipo,serie){
 const params=(TIPOS_EXERCICIO[tipo]?.params||TIPOS_EXERCICIO.outro.params).filter(p=>p!=="series");
 return params.map(p=>serie?.[p]!==""&&serie?.[p]!=null?`${PARAMETROS[p].label}: ${formatarValor(p,serie[p])}`:null).filter(Boolean).join(" · ");
}
function historicoComSeries(exercicio,row){
 const tipo=row?.tipo||exercicio?.tipo||inferirTipoExercicio(exercicio?.nome||"",exercicio?.grupo||"");
 if(Array.isArray(row?.seriesData))return row.seriesData;
 const fake={...exercicio,...row,series:row?.series||exercicio?.series};
 return extrairSeriesExercicio(fake);
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
 const series=extrairSeriesExercicio({...x,tipo:meta.tipo});
 const seriesHtml=series.map((s,n)=>`<div class="series-card-line"><span>Série ${n+1}</span><strong>${escapeHtml(serieResumo(meta.tipo,s)||"Sem valores")}</strong></div>`).join("");
 return `<article class="exercise-card"><div class="exercise-top"><div class="exercise-number">${String(i+1).padStart(2,"0")}</div><div class="exercise-info"><strong>${escapeHtml(x.nome)}</strong><span>${escapeHtml(tipoLabel)}${meta.personalizado?" · Personalizado":""}</span></div><button class="delete-exercise" data-index="${i}" aria-label="Remover exercício">×</button></div><div class="exercise-series-list">${seriesHtml}</div><div class="exercise-card-actions"><button class="secondary-btn update-exercise-button" data-index="${i}">🔵 Atualizar</button><button class="progress-button" data-index="${i}">🟣 Ver progressão →</button></div></article>`;
}

function abrirAdicionar(){
 const r=document.getElementById("workout-root");
 r.innerHTML=`<button class="back-button" id="backWorkout">← Voltar</button><div class="workout-header"><span class="eyebrow">NOVO EXERCÍCIO</span><h2>Adicionar exercício</h2><p class="muted">Escolhe primeiro o exercício. Depois define o número de séries e os valores de cada série.</p></div>
 <div class="form-card workout-add-form"><label>Exercício</label><div class="exercise-picker-trigger-wrap"><input id="exerciseName" class="input exercise-name-input" type="text" placeholder="Selecionar exercício" readonly><button type="button" class="exercise-picker-trigger" id="openExercisePicker"><span>⌕</span> Escolher exercício</button></div><div class="exercise-selection-hint" id="exerciseSelectionHint">Procura um exercício existente ou cria um novo.</div><div id="exerciseTypeWrap"></div><div id="seriesSetup" class="series-setup" hidden><div class="series-count-row"><div><label for="seriesCount">Número de séries</label><small>Depois poderás definir os valores de cada série individualmente.</small></div><input id="seriesCount" class="input series-count-input" type="number" min="1" max="30" value="1"></div><button class="primary-btn full" id="continueSeries">Continuar</button></div><div id="exerciseFields" class="adaptive-exercise-fields"></div><button class="primary-btn full" id="saveExercise" hidden>Adicionar ao treino</button></div>`;
 document.getElementById("backWorkout").onclick=renderTreino;
 document.getElementById("openExercisePicker").onclick=abrirSeletorExercicio;
 document.getElementById("continueSeries").onclick=()=>{
   const input=document.getElementById("exerciseName");const tipo=document.getElementById("exerciseType")?.value||input?.dataset.tipo;if(!input?.value||!tipo)return alert("Escolhe primeiro um exercício.");
   const n=Math.max(1,Math.min(30,Number(document.getElementById("seriesCount")?.value)||1));
   document.getElementById("seriesCount").value=n;renderLinhasSeries(document.getElementById("exerciseFields"),{nome:input.value,tipo},n);document.getElementById("saveExercise").hidden=false;document.getElementById("seriesSetup").hidden=true;
 };
 document.getElementById("saveExercise").onclick=guardarExercicio;
 requestAnimationFrame(abrirSeletorExercicio);
}
function abrirSeletorExercicio(){
 fecharSeletorExercicio();
 const overlay=document.createElement("div");overlay.className="exercise-picker-overlay open";overlay.id="exercisePickerOverlay";
 overlay.innerHTML=`<div class="exercise-picker" role="dialog" aria-modal="true"><div class="exercise-picker-handle"></div><div class="exercise-picker-header"><div><span class="eyebrow">BIBLIOTECA DE EXERCÍCIOS</span><h2>Adicionar exercício</h2></div><button type="button" class="exercise-picker-close" id="closeExercisePicker">×</button></div><div class="exercise-search-wrap"><span class="exercise-search-icon">⌕</span><input id="exerciseSearch" class="exercise-search-input" type="search" placeholder="Procurar ou escrever exercício..." autocomplete="off" spellcheck="false"></div><div class="exercise-search-meta" id="exerciseSearchMeta"></div><div class="exercise-search-results" id="exerciseSearchResults"></div></div>`;
 document.body.appendChild(overlay);const input=document.getElementById("exerciseSearch");const render=()=>renderResultadosPesquisa(input.value);input.addEventListener("input",render);document.getElementById("closeExercisePicker").onclick=fecharSeletorExercicio;overlay.addEventListener("click",e=>{if(e.target===overlay)fecharSeletorExercicio()});document.addEventListener("keydown",fecharSeletorPorTecla);render();requestAnimationFrame(()=>input.focus());
}
function fecharSeletorPorTecla(e){if(e.key==="Escape")fecharSeletorExercicio()}
function fecharSeletorExercicio(){document.getElementById("exercisePickerOverlay")?.remove();document.removeEventListener("keydown",fecharSeletorPorTecla)}
function renderResultadosPesquisa(termo){
 const results=document.getElementById("exerciseSearchResults"),meta=document.getElementById("exerciseSearchMeta");if(!results)return;
 const lista=pesquisarExercicios(termo),q=String(termo||"").trim();if(meta)meta.textContent=q?`${lista.length} resultado(s)`:`${lista.length} exercícios disponíveis`;
 const customCta=q?`<div class="exercise-search-custom-row"><div><strong>Queres adicionar um exercício próprio?</strong><span>Escreve qualquer nome e escolhe o tipo no passo seguinte.</span></div><button type="button" class="custom-exercise-btn" id="createCustomExercise">+ Adicionar "${escapeHtml(q)}"</button></div>`:`<div class="exercise-search-custom-row exercise-search-custom-row-empty"><div><strong>Não encontras o que procuras?</strong><span>Podes escrever manualmente o nome de qualquer exercício e criá-lo.</span></div><button type="button" class="custom-exercise-btn" id="createCustomExercise">+ Adicionar exercício personalizado</button></div>`;
 const listaHtml=lista.map(item=>`<button type="button" class="exercise-search-result" data-exercise-name="${escaparAtributo(item.nome)}"><span class="exercise-search-result-icon">${item.personalizado?"✦":"＋"}</span><span class="exercise-search-result-copy"><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(item.grupo)} · ${escapeHtml(TIPOS_EXERCICIO[item.tipo]?.label||"Outro")}${item.personalizado?" · Personalizado":""}</small></span><span class="exercise-search-result-arrow">›</span></button>`).join("");
 results.innerHTML=(lista.length?listaHtml:`<div class="exercise-search-empty"><div class="exercise-search-empty-icon">⌕</div><strong>${q?"Não encontrámos este exercício.":"Pesquisa um exercício ou cria um novo."}</strong><p>${q?"Podes adicioná-lo ao teu treino e escolher o tipo mais adequado.":"Escreve o nome na caixa acima para procurar ou criar um exercício."}</p></div>`)+customCta;
 document.getElementById("createCustomExercise")?.addEventListener("click",()=>{const nome=(document.getElementById("exerciseSearch")?.value||"").trim();if(!nome){document.getElementById("exerciseSearch")?.focus();return;}selecionarExercicio(nome,true)});
 results.querySelectorAll("[data-exercise-name]").forEach(btn=>btn.onclick=()=>{const item=construirBibliotecaExercicios().find(x=>normalizarTexto(x.nome)===normalizarTexto(btn.dataset.exerciseName));selecionarExercicio(item?.nome||btn.dataset.exerciseName,!!item?.personalizado,item)});
}
function selecionarExercicio(nome,personalizado=false,item=null){
 const input=document.getElementById("exerciseName");if(!input)return;const tipo=item?.tipo||inferirTipoExercicio(nome,item?.grupo);
 input.value=nome;input.dataset.personalizado=personalizado?"true":"false";input.dataset.tipo=tipo;input.dataset.grupo=item?.grupo||inferirGrupoExercicio(nome);
 const hint=document.getElementById("exerciseSelectionHint");if(hint)hint.innerHTML=personalizado?`<span class="custom-selected-badge">✦ Exercício personalizado</span> Escolhe o tipo abaixo.`:`<span class="existing-selected-badge">✓ Exercício selecionado</span> ${escapeHtml(item?.grupo||inferirGrupoExercicio(nome))}`;
 fecharSeletorExercicio();
 const wrap=document.getElementById("exerciseTypeWrap");if(personalizado){wrap.innerHTML=`<div class="exercise-type-block"><label for="exerciseType">Tipo de exercício</label><select id="exerciseType" class="input">${Object.entries(TIPOS_EXERCICIO).map(([key,v])=>`<option value="${key}" ${key===tipo?"selected":""}>${v.label}</option>`).join("")}</select></div>`}else wrap.innerHTML="";
 document.getElementById("seriesSetup").hidden=false;document.getElementById("exerciseFields").innerHTML="";document.getElementById("saveExercise").hidden=true;
}
function guardarExercicio(){
 const nameInput=document.getElementById("exerciseName"),container=document.getElementById("exerciseFields");const nome=nameInput?.value.trim();if(!nome)return alert("Escolhe um exercício.");
 const tipo=document.getElementById("exerciseType")?.value||nameInput.dataset.tipo||inferirTipoExercicio(nome,nameInput.dataset.grupo);const grupo=nameInput.dataset.grupo||inferirGrupoExercicio(nome);const seriesData=recolherSeries(container,tipo);const error=validarSeries(tipo,seriesData);if(error)return alert(error);
 const personal=nameInput.dataset.personalizado==="true";if(personal&&!exerciciosPersonalizados.some(x=>normalizarTexto(x.nome)===normalizarTexto(nome))){exerciciosPersonalizados.push({id:`custom-${Date.now()}`,nome,grupo,tipo,criadoEm:new Date().toISOString()});saveExerciciosPersonalizados()}
 const t=treinoAtual();const now=Date.now();const reg={id:now,data:formatarData(),tipo,series:seriesData.length,seriesData};t.exercicios.push({id:now,nome,grupo,tipo,personalizado:personal,series:seriesData.length,seriesData,historico:[reg]});save();renderTreino();
}
function abrirEditorExercicio(exercicio){
 if(!exercicio)return;document.getElementById("exerciseEditorOverlay")?.remove();
 const overlay=document.createElement("div");overlay.className="exercise-editor-overlay open";overlay.id="exerciseEditorOverlay";const tipo=exercicio.tipo||inferirTipoExercicio(exercicio.nome,exercicio.grupo);const count=numeroSeriesExercicio(exercicio);
 overlay.innerHTML=`<div class="exercise-editor" role="dialog" aria-modal="true"><div class="exercise-editor-top"><div><span class="eyebrow">ATUALIZAR EXERCÍCIO</span><h2>${escapeHtml(exercicio.nome)}</h2><p class="muted">Atualiza cada série individualmente. A alteração será guardada como nova evolução.</p></div><button class="exercise-picker-close" id="closeExerciseEditor" aria-label="Fechar">×</button></div><div class="series-setup editor-series-setup"><div class="series-count-row"><div><label for="editorSeriesCount">Número de séries</label><small>Podes aumentar ou reduzir o número de séries nesta atualização.</small></div><input id="editorSeriesCount" class="input series-count-input" type="number" min="1" max="30" value="${count}"></div></div><div id="exerciseEditorFields" class="adaptive-exercise-fields"></div><button class="primary-btn full" id="saveExerciseEdition">Guardar atualização</button></div>`;
 document.body.appendChild(overlay);renderLinhasSeries(document.getElementById("exerciseEditorFields"),exercicio,count);document.getElementById("editorSeriesCount").addEventListener("change",()=>renderLinhasSeries(document.getElementById("exerciseEditorFields"),exercicio,Number(document.getElementById("editorSeriesCount").value)||1));document.getElementById("closeExerciseEditor").onclick=()=>overlay.remove();overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove()});document.getElementById("saveExerciseEdition").onclick=()=>guardarAtualizacaoExercicio(exercicio);
}
function guardarAtualizacaoExercicio(exercicio){
 const tipo=exercicio.tipo||inferirTipoExercicio(exercicio.nome,exercicio.grupo);const seriesData=recolherSeries(document.getElementById("exerciseEditorFields"),tipo);const err=validarSeries(tipo,seriesData);if(err)return alert(err);
 const reg={id:Date.now(),data:formatarData(),tipo,series:seriesData.length,seriesData};const historico=Array.isArray(exercicio.historico)?exercicio.historico:[];historico.push(reg);exercicio.historico=historico;exercicio.series=seriesData.length;exercicio.seriesData=seriesData;Object.keys(PARAMETROS).forEach(p=>{if(p!=="series")delete exercicio[p]});Object.assign(exercicio,{tipo});save();document.getElementById("exerciseEditorOverlay")?.remove();renderTreino();
}
function mostrarProgressao(exercicio){
 if(!exercicio)return;document.getElementById("progressOverlay")?.remove();const tipo=exercicio.tipo||inferirTipoExercicio(exercicio.nome,exercicio.grupo);const h=Array.isArray(exercicio.historico)?exercicio.historico:[];
 const overlay=document.createElement("div");overlay.className="progress-overlay open";overlay.id="progressOverlay";
 const historyHtml=h.length?h.map(row=>{const series=historicoComSeries(exercicio,row);return `<article class="progress-history-entry"><div class="progress-history-date">${escapeHtml(row.data||"—")}</div><div class="progress-history-series">${series.map((s,i)=>`<div class="progress-history-series-row"><span>Série ${i+1}</span><strong>${escapeHtml(serieResumo(tipo,s)||"Sem valores")}</strong></div>`).join("")}</div></article>`}).join(""): `<div class="progress-empty"><strong>Ainda não existe histórico.</strong><p>As atualizações guardadas neste exercício aparecerão aqui.</p></div>`;
 overlay.innerHTML=`<div class="progress-modal" role="dialog" aria-modal="true"><div class="exercise-editor-top"><div><span class="eyebrow">PROGRESSÃO</span><h2>${escapeHtml(exercicio.nome)}</h2><p class="muted">Histórico de evolução · apenas consulta</p></div><button class="exercise-picker-close" id="closeProgress" aria-label="Fechar">×</button></div><div class="progress-history-list">${historyHtml}</div><div class="progress-readonly-note">🔒 Consulta apenas. Para registar novos valores, utiliza o botão <strong>Atualizar</strong> no exercício.</div><div class="progress-actions"><button class="secondary-btn" id="closeProgressBottom">Fechar</button></div></div>`;
 document.body.appendChild(overlay);document.getElementById("closeProgress").onclick=()=>overlay.remove();document.getElementById("closeProgressBottom").onclick=()=>overlay.remove();overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove()});
}

document.addEventListener("DOMContentLoaded",renderTreino);
