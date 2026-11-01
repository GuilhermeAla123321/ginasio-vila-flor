/* Progresso corporal e descanso por série. Funciona sem servidor. */
(() => {
  'use strict';
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const REGIONS = {peito:'Peito',costas:'Costas',trapezio:'Trapézio',lombar:'Lombar',ombros:'Ombros',biceps:'Bíceps',triceps:'Tríceps',antebracos:'Antebraços',abdomen:'Abdominais',obliquos:'Oblíquos',quadriceps:'Quadríceps',posteriores:'Posteriores',gluteos:'Glúteos',gemeos:'Gémeos'};
  // Nomes usados no campo «musculos» do catálogo. A primeira regra que corresponde ganha.
  const MUSCLE_RULES = [
    [/peitoral/,['peito']],[/deltoide/,['ombros']],[/tricep/,['triceps']],[/bicep|braquial/,['biceps']],
    [/antebraco/,['antebracos']],[/obliquo/,['obliquos']],[/core|abdomin/,['abdomen','obliquos']],
    [/dorsai|costas|romboide/,['costas']],[/trapezio/,['trapezio']],[/eretor|lombar/,['lombar']],
    [/glute|abdutor/,['gluteos']],[/gemeo|soleo/,['gemeos']],[/posterior/,['posteriores']],[/quadricep/,['quadriceps']],
    [/^bracos$/,['biceps','triceps']],[/^pernas$/,['quadriceps','posteriores','gluteos','gemeos']]
  ];
  // Exercícios fora do catálogo (peso livre, personalizados). Alvo principal primeiro; a ordem importa.
  const NAME_RULES = [
    [/gemeo|panturrilha|calf|flexao plantar/,['gemeos']],
    [/isquio|flexora|flexao de pernas|leg curl|stiff|romeno/,['posteriores','gluteos','lombar']],
    [/peso morto/,['gluteos','posteriores','lombar','costas']],
    [/extensao de (quadricep|pernas)|extensora/,['quadriceps']],
    [/elevacao pelvica|hip thrust|kickback|coice|abducao|abdut/,['gluteos','posteriores']],
    [/agachamento|leg press|lunge|afundo|bulgaro|aducao/,['quadriceps','gluteos','posteriores']],
    [/supino|chest press/,['peito','triceps','ombros']],
    [/crucifixo invertido|face pull/,['ombros','trapezio','costas']],
    [/crucifixo|peck.deck|fly/,['peito','ombros']],
    [/puxada|lat pull|barra fixa/,['costas','biceps']],
    [/encolhimento|shrug/,['trapezio']],
    [/remada|remo/,['costas','biceps','trapezio']],
    [/hiperextens|lombar/,['lombar','gluteos']],
    [/elevacao (lateral|frontal)/,['ombros']],
    [/press.*ombro|prensa.*ombro|desenvolvimento/,['ombros','triceps']],
    [/tricep|frances|pushdown|fundos/,['triceps']],
    [/antebraco|punho/,['antebracos']],
    [/rosca|bicep|curl/,['biceps','antebracos']],
    [/obliqu/,['obliquos','abdomen']],
    [/abdominal|crunch|prancha|ab wheel/,['abdomen','obliquos']],
    [/caminhada|corrida|passadeira|eliptica|bicicleta/,['quadriceps','gluteos','posteriores','gemeos']]
  ];
  const GROUP_REGIONS = {peito:['peito'],costas:['costas'],ombros:['ombros'],bracos:['biceps','triceps'],pernas:['quadriceps','posteriores','gluteos','gemeos'],gluteos:['gluteos'],core:['abdomen','obliquos']};
  let catalog=null;
  function catalogMuscles(nome){
    if(!catalog){
      catalog=new Map();
      const sources=[typeof EQUIPAMENTOS_EXERCICIOS!=='undefined'?EQUIPAMENTOS_EXERCICIOS:{},typeof EXERCICIOS_EXTRA!=='undefined'?EXERCICIOS_EXTRA:{}];
      sources.forEach(source=>Object.values(source).flat().forEach(item=>{
        if(item?.musculos&&!catalog.has(norm(item.nome)))catalog.set(norm(item.nome),item.musculos);
      }));
    }
    return catalog.get(norm(nome));
  }
  function regionsFor(ex){
    const listed=catalogMuscles(ex?.nome);
    if(listed)return [...new Set(listed.flatMap(m=>MUSCLE_RULES.find(([re])=>re.test(norm(m)))?.[1]||[]))];
    const nome=norm(ex?.nome);
    return NAME_RULES.find(([re])=>re.test(nome))?.[1]||GROUP_REGIONS[norm(ex?.grupo)]||[];
  }
  // Ilustrações detalhadas extraídas da referência enviada, com fundos transparentes.
  // Cada caminho SVG usa a coordenada REAL da ilustração e está mascarado
  // pelo alfa da silhueta: nenhuma cor pode ultrapassar o músculo desenhado.
  const anatomia = {
    anterior: { x:48, y:9, w:499, h:803, src:'images/progress/corpo-anterior-detalhado.png',
      parts: {
        peito: [
          'M290 178 Q265 162 236 169 Q199 168 188 195 Q185 224 214 237 Q242 251 280 241 Q293 235 297 219 L297 188 Z',
          'M310 177 Q335 164 364 170 Q396 169 407 194 Q419 218 391 235 Q361 248 328 240 Q310 231 303 214 L303 188 Z'
        ],
        ombros: [
          'M210 164 Q179 167 165 181 Q145 197 156 224 Q177 224 192 209 Q203 195 216 177 Z',
          'M394 165 Q422 167 437 185 Q453 206 444 229 Q420 220 409 209 Q400 195 388 176 Z'
        ],
        trapezio: [
          'M239 134 Q253 147 294 155 L291 177 Q251 167 223 159 Z',
          'M309 155 Q349 145 365 134 L377 158 Q352 167 310 178 Z'
        ],
        biceps: [
          'M177 218 Q158 233 149 262 L143 284 Q142 304 156 324 Q176 303 191 264 L197 236 Z',
          'M424 221 Q442 239 450 268 L458 293 Q457 312 443 325 Q422 303 409 264 L402 236 Z'
        ],
        triceps: [
          'M149 223 Q138 246 136 281 Q135 298 142 311 L153 297 Q154 265 169 230 Z',
          'M451 224 Q467 246 471 281 Q473 299 459 313 L448 301 Q450 266 437 230 Z'
        ],
        antebracos: [
          'M143 309 Q126 313 115 347 Q101 373 93 418 L114 433 Q137 386 153 338 Z',
          'M459 308 Q477 314 487 348 Q504 384 510 419 L492 432 Q468 386 449 337 Z'
        ],
        abdomen: [
          'M265 239 Q280 244 293 242 L292 272 Q277 279 265 273 Z',
          'M308 242 Q326 244 338 239 L339 271 Q327 277 310 273 Z',
          'M262 279 Q275 285 294 281 L293 309 Q278 318 262 309 Z',
          'M308 282 Q330 283 341 278 L342 308 Q327 318 310 310 Z',
          'M264 315 Q280 324 294 317 L293 348 Q283 356 268 347 Z',
          'M308 317 Q324 321 339 313 L337 346 Q321 357 309 349 Z'
        ],
        obliquos: [
          'M224 256 Q242 270 254 271 Q263 311 262 368 L245 385 Q229 366 225 330 Z',
          'M375 257 Q356 270 346 271 Q339 314 340 368 L359 384 Q370 367 375 330 Z'
        ],
        quadriceps: [
          'M209 405 Q227 390 249 404 Q261 428 268 472 Q268 519 250 558 Q235 573 217 554 Q200 515 198 468 Z',
          'M269 406 Q290 405 297 433 L295 507 Q281 542 270 563 L250 559 Q272 497 269 434 Z',
          'M354 405 Q375 391 391 417 Q406 449 402 479 Q401 531 377 562 Q359 565 348 544 Q334 513 340 459 Z',
          'M331 405 Q312 406 303 433 L306 505 Q315 542 329 562 L348 550 Q326 497 331 433 Z'
        ],
        gemeos: [
          'M224 588 Q244 580 255 597 Q269 627 257 662 L248 719 L222 723 Q208 689 209 651 Q207 609 224 588 Z',
          'M362 591 Q379 585 390 602 Q405 628 392 663 L382 721 L356 723 Q343 685 348 649 Q348 613 362 591 Z'
        ]
      }
    },
    posterior: { x:709, y:9, w:473, h:803, src:'images/progress/corpo-posterior-detalhado.png',
      parts: {
        trapezio: [
          'M932 124 Q906 143 873 159 Q866 173 886 200 Q922 214 946 244 L947 165 Z',
          'M969 123 Q992 144 1033 162 Q1040 180 1018 201 Q985 215 958 244 L958 167 Z'
        ],
        costas: [
          'M876 205 Q902 206 949 244 L948 302 Q919 326 878 357 Q857 329 843 287 Q849 248 876 205 Z',
          'M1027 205 Q999 207 954 244 L958 302 Q988 329 1026 359 Q1047 328 1060 287 Q1053 250 1027 205 Z',
          'M943 299 L947 364 Q927 378 908 396 L894 373 Q915 328 943 299 Z',
          'M961 299 L958 366 Q975 380 996 396 L1011 372 Q984 329 961 299 Z'
        ],
        lombar: [
          'M937 310 Q946 317 949 349 L949 395 Q935 402 916 391 Q923 357 937 310 Z',
          'M965 310 Q954 317 955 349 L955 395 Q971 402 991 391 Q982 358 965 310 Z'
        ],
        ombros: [
          'M865 163 Q835 168 823 189 Q821 214 836 230 Q860 217 878 199 Q883 184 865 163 Z',
          'M1038 163 Q1066 168 1081 188 Q1084 214 1066 230 Q1044 218 1024 199 Q1021 184 1038 163 Z'
        ],
        triceps: [
          'M834 228 Q811 236 809 277 Q808 298 818 326 Q836 312 851 277 L859 234 Z',
          'M1069 228 Q1096 237 1098 278 Q1100 301 1085 326 Q1070 309 1057 277 L1048 234 Z'
        ],
        antebracos: [
          'M814 314 Q795 321 780 354 Q767 381 760 421 L777 446 Q797 418 816 385 L837 330 Z',
          'M1091 314 Q1112 321 1124 352 Q1142 383 1145 421 L1129 446 Q1106 413 1088 383 L1066 330 Z'
        ],
        gluteos: [
          'M866 394 Q892 384 942 410 Q943 450 916 478 Q895 493 871 478 Q849 456 866 394 Z',
          'M1038 394 Q1011 383 960 410 Q957 450 987 478 Q1008 493 1035 478 Q1054 455 1038 394 Z'
        ],
        posteriores: [
          'M861 485 Q883 477 901 490 Q914 521 909 560 L881 605 Q852 590 847 548 Q841 509 861 485 Z',
          'M911 488 Q927 485 943 494 L940 559 L922 605 Q904 566 904 528 Z',
          'M1038 485 Q1017 478 1003 492 Q994 528 997 557 L1024 603 Q1053 589 1058 548 Q1062 508 1038 485 Z',
          'M995 486 Q979 484 964 493 L964 559 L982 604 Q1001 567 1001 528 Z'
        ],
        gemeos: [
          'M866 606 Q891 598 910 619 Q926 653 911 699 L886 731 Q864 715 852 676 Q847 632 866 606 Z',
          'M1038 606 Q1013 598 994 619 Q980 656 994 699 L1017 730 Q1044 713 1053 677 Q1061 634 1038 606 Z'
        ]
      }
    }
  };
  function getTargets(){
    const series={},weight={};
    const plans=typeof treinos!=='undefined'?treinos:{};
    Object.values(plans||{}).forEach(day=>(Array.isArray(day)?day:[]).forEach(workout=>(workout.exercicios||[]).forEach(ex=>{
      const n=Array.isArray(ex.seriesData)&&ex.seriesData.length?ex.seriesData.length:Math.max(1,Number(ex.series)||1);
      // O primeiro músculo é o alvo principal; os restantes contam metade na intensidade da cor.
      regionsFor(ex).forEach((region,i)=>{
        series[region]=(series[region]||0)+n;
        weight[region]=(weight[region]||0)+(i?n/2:n);
      });
    })));
    return {series,weight};
  }
  function body(view,weight,highest){
    const data=anatomia[view];
    const bodySvg=Object.entries(data.parts).map(([key,segments])=>{
      const amount=weight[key]||0;if(!amount)return '';
      const opacity=(.5+.5*amount/highest).toFixed(3);
      return `<g class="gym-muscle-region" data-muscle="${key}" opacity="${opacity}" filter="url(#gymSoft-${view})">${segments.map(shape=>`<path d="${shape}"/>`).join('')}</g>`;
    }).join('');
    return `<div class="gym-anatomy-layers detailed-anatomy" role="img" aria-label="Vista ${view} — músculos alvo dos teus treinos a roxo">
      <img class="gym-anatomy-neutral" src="${data.src}" alt="" loading="eager" decoding="sync" draggable="false" />
      <svg class="gym-anatomy-overlay" aria-hidden="true" viewBox="${data.x} ${data.y} ${data.w} ${data.h}" preserveAspectRatio="none" style="-webkit-mask-image:url('${data.src}');mask-image:url('${data.src}')"><filter id="gymSoft-${view}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.8"/></filter>${bodySvg}</svg>
    </div>`;
  }
  // As ilustrações ficam em memória para o mapa aparecer logo ao abrir a página.
  Object.values(anatomia).forEach(view=>{new Image().src=view.src;});
  let ultimoMapa=null;
  function renderProgress(){
    const root=document.getElementById('gymProgressBody');if(!root)return;
    const {series,weight}=getTargets();
    const assinatura=JSON.stringify(series);
    if(assinatura===ultimoMapa&&root.firstChild)return;
    ultimoMapa=assinatura;
    const targets=Object.keys(weight).sort((a,b)=>weight[b]-weight[a]);
    const highest=Math.max(1,...Object.values(weight)),mostSeries=Math.max(1,...Object.values(series));
    root.innerHTML=`<div class="gym-progress-grid">
      <div class="gym-body-card">${body('anterior',weight,highest)}<strong>Vista anterior</strong></div>
      <div class="gym-body-card">${body('posterior',weight,highest)}<strong>Vista posterior</strong></div>
      <div class="gym-progress-totals"><strong>Músculos alvo</strong>${targets.length?targets.map(k=>`<div class="gym-progress-line"><b>${REGIONS[k]}</b><span class="track"><span class="fill" style="width:${Math.round(100*series[k]/mostSeries)}%"></span></span><em>${series[k]} ${series[k]===1?'série':'séries'}</em></div>`).join(''):'<p class="gym-progress-empty">Adiciona exercícios para veres os músculos alvo.</p>'}</div>
    </div>`;
  }
  // Descanso geral + descansos entre séries: relógios independentes.
  // Todos calculam pelo horário absoluto, não pelo número de ticks, para evitar
  // atrasos do contador quando o navegador está em segundo plano.
  const REST_DEFAULT_KEY = 'vf_workout_default_rest_seconds_v1';
  const GENERAL_STATE_KEY = 'vf_workout_general_rest_v1';
  const choices = Array.from({length:20},(_,i)=>(i+1)*15); // 00:15 a 05:00
  const MIN_SECONDS = 1, MAX_SECONDS_MINUTES = 60, MAX_SECONDS = MAX_SECONDS_MINUTES * 60; // o servidor só agenda alertas até 60 min
  const validSeconds = value => Number.isInteger(Number(value)) && Number(value) >= MIN_SECONDS && Number(value) <= MAX_SECONDS;
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
  // A <select> guarda a escolha; o relógio por cima mostra o tempo a correr.
  function syncSlot(row,seconds){
    const select=row?.querySelector('.gym-rest-select');if(!select)return;
    const values=[...new Set([...choices,...customTimes,seconds])].sort((a,b)=>a-b);
    select.innerHTML=values.map(v=>`<option value="${v}"${customTimes.includes(v)?' data-removivel':''}>${fmt(v)}</option>`).join('')+'<option value="custom">Personalizado…</option>';
    select.value=String(seconds);
  }
  const readJson = key => { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } };
  const storage = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };
  let defaultSeconds = Number(readJson(REST_DEFAULT_KEY));
  if (!validSeconds(defaultSeconds)) defaultSeconds = 90;
  // Tempos criados pelo utilizador. Um padrão antigo fora da lista passa a ser um deles, para se poder apagar.
  const CUSTOM_TIMES_KEY = 'vf_rest_custom_times_v1';
  const temposGuardados = readJson(CUSTOM_TIMES_KEY);
  let customTimes = (Array.isArray(temposGuardados) ? temposGuardados : []).map(Number).filter(validSeconds);
  if (!choices.includes(defaultSeconds) && !customTimes.includes(defaultSeconds)) customTimes.push(defaultSeconds);
  const fmt = n => `${String(Math.floor(Math.max(0,n)/60)).padStart(2,'0')}:${String(Math.max(0,n)%60).padStart(2,'0')}`;

  let general = {duration:defaultSeconds, remaining:defaultSeconds, running:false, paused:false, deadline:0};
  const previous = readJson(GENERAL_STATE_KEY);
  if (previous && validSeconds(previous.duration)) {
    general.duration=Number(previous.duration);
    if (previous.running && Number.isFinite(Number(previous.deadline))) {
      general.deadline=Number(previous.deadline);
      general.remaining=Math.max(0,Math.ceil((general.deadline-Date.now())/1000));
      general.running=general.remaining>0;general.paused=false;
      // Terminou com a app fechada: fica pronto a recomeçar, como quando termina com ela aberta.
      if(!general.running){general.remaining=general.duration;general.deadline=0;}
    } else {
      general.remaining=Math.min(general.duration,Number(previous.remaining)||general.duration);
      general.paused=Boolean(previous.paused);
    }
  }
  let gap = {el:null,duration:defaultSeconds,remaining:defaultSeconds,running:false,paused:false,deadline:0};
  let ticker=null;
  let audioCtx=null;
  let audioUnlocked=false;
  let toastTimer=null;
  let toastToken=0;
  const getGlobal = id => document.getElementById(id);
  const alerts=()=>window.TimerBackgroundAlerts;

  function saveGeneral(){storage(GENERAL_STATE_KEY,general);}
  function cancelPush(kind){
    try {Promise.resolve(alerts()?.cancelNamed?.(kind)).catch(()=>{});}catch(_){}
  }
  function schedulePush(kind,deadline){
    try {Promise.resolve(alerts()?.scheduleNamed?.(kind,deadline)).catch(()=>{});}catch(_){}
  }
  function ensureAudio(){
    if(!audioCtx){const Class=window.AudioContext||window.webkitAudioContext; if(Class)try{audioCtx=new Class();}catch(_){}}
    if(audioCtx&&audioCtx.state!=='running') audioCtx.resume().catch(()=>{});
    // O iOS só desbloqueia o áudio se um som começar durante um toque: basta um instante de silêncio.
    if(audioCtx&&!audioUnlocked){
      try{
        const silence=audioCtx.createBufferSource();
        silence.buffer=audioCtx.createBuffer(1,1,22050);
        silence.connect(audioCtx.destination);silence.start(0);
        audioUnlocked=true;
      }catch(_){}
    }
  }
  function soundForThreeSeconds(){
    if(!audioCtx || audioCtx.state==='closed') return;
    if(audioCtx.state!=='running') audioCtx.resume().catch(()=>{});
    // Por defeito, o botão de silêncio do iPhone cala este áudio; «transient» toca na mesma sem parar a música.
    try{
      if(navigator.audioSession){
        navigator.audioSession.type='transient';
        setTimeout(()=>{try{navigator.audioSession.type='auto';}catch(_){}},3200);
      }
    }catch(_){}
    const start=audioCtx.currentTime+.03;
    // Sininho de 3 segundos: o badalo alterna entre dois tons agudos, com parciais
    // não harmónicos para o brilho metálico, e o último toque fica a ressoar.
    try {
      const end=start+3;
      const master=audioCtx.createGain();
      master.gain.setValueAtTime(2.5,start);
      master.gain.setValueAtTime(2.5,end-.25);
      master.gain.exponentialRampToValueAtTime(.0001,end);
      master.connect(audioCtx.destination);
      for(let strike=0;strike<16;strike++){
        const at=start+strike*.16,note=strike%2?2637:2093,level=strike%2?.8:1;
        const ring=strike===15?end-at:.55;
        for(const [ratio,peak,decay] of [[1,.12,1],[2.76,.035,.45],[5.4,.012,.2]]){
          const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
          const stop=Math.min(end,at+ring*decay);
          osc.frequency.value=note*ratio;
          gain.gain.setValueAtTime(.0001,at);
          gain.gain.exponentialRampToValueAtTime(peak*level,at+.004);
          gain.gain.exponentialRampToValueAtTime(.0001,stop);
          osc.connect(gain);gain.connect(master);
          osc.start(at);osc.stop(stop);
          osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch(_){}};
        }
      }
      setTimeout(()=>{try{master.disconnect();}catch(_){}},3200);
    }catch(_){}
  }
  const ICONES_TOAST = {
    descanso: '<svg class="vf-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
    feito: '<svg class="vf-i" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    fim: '<svg class="vf-i" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8Z"/></svg>'
  };
  function showRestToast(kind){
    showToast(ICONES_TOAST.descanso,kind==='geral'?'Descanso geral terminado':'Descanso entre séries terminado','Está na hora de retomar o treino.');
  }
  // Conta o que está marcado no ecrã.
  function showEncouragement(button){
    const pending=root=>root.querySelector('.gym-series-complete[aria-pressed="false"]');
    const left=(n,one,many)=>`${n===1?`Está quase, continua: falta 1 ${one}`:`Continua: faltam ${n} ${many}`}.`;
    const exercise=button.closest('.exercise-card'),workout=button.closest('.workout-group-card');
    if(!exercise||!workout)return;
    const seriesLeft=exercise.querySelectorAll('.gym-series-complete[aria-pressed="false"]').length;
    const exercisesLeft=[...workout.querySelectorAll('.exercise-card')].filter(pending).length;
    if(seriesLeft)showToast(ICONES_TOAST.feito,'Bom trabalho!',left(seriesLeft,'série','séries'));
    else if(exercisesLeft)showToast(ICONES_TOAST.feito,'Exercício concluído, bom trabalho!',left(exercisesLeft,'exercício','exercícios'));
    else showToast(ICONES_TOAST.fim,'Treino concluído!','Excelente trabalho, foste até ao fim.');
  }
  function showToast(icon,title,text){
    const toast=getGlobal('gymRestCompleteToast');if(!toast)return;
    getGlobal('gymRestCompleteIcon').innerHTML=icon;
    getGlobal('gymRestCompleteTitle').textContent=title;
    getGlobal('gymRestCompleteText').textContent=text;
    toast.hidden=false;
    toast.classList.remove('is-showing');
    void toast.offsetWidth;
    toast.classList.add('is-showing');
    const token=++toastToken;
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{if(token===toastToken)toast.hidden=true;},3000);
  }
  function completeRest(kind){
    if(document.visibilityState==='visible'){
      cancelPush(kind);
      soundForThreeSeconds();
      try{navigator.vibrate?.([250,110,250,110,250]);}catch(_){}
      showRestToast(kind);
    } else {
      // Um push real depende do OneSignal (servidor), de permissão e de a app
      // estar instalada em iOS. Notification() não é um alarme agendável nativo.
      try{alerts()?.notifyNamed?.(kind);}catch(_){}
    }
  }

  // O ícone só é trocado quando muda: refazê-lo a cada tick perderia toques a meio.
  function setPlayButton(button,running,label){
    if(!button||button.dataset.state===label)return;
    button.dataset.state=label;
    button.innerHTML=running?ICON_PAUSE:ICON_PLAY;
    button.setAttribute('aria-label',`${label} descanso`);
  }
  const playLabel=clock=>clock.running?'Pausar':clock.remaining===0?'Recomeçar':clock.paused?'Retomar':'Iniciar';
  function renderGeneral(){
    const clock=getGlobal('gymGeneralClock'), bar=getGlobal('gymGeneralBar');
    if(!clock||!bar)return;
    clock.textContent=fmt(general.remaining);
    bar.style.width=`${Math.max(0,Math.min(100,general.remaining/general.duration*100))}%`;
    setPlayButton(getGlobal('gymGeneralStart'),general.running,playLabel(general));
    getGlobal('gymGeneralRest')?.classList.toggle('is-running',general.running);
    getGlobal('gymGeneralRest')?.classList.toggle('is-finished',general.remaining===0);
  }
  function renderGap(){
    if(!gap.el?.isConnected)return;
    const clock=gap.el.querySelector('.gym-inline-rest-clock');
    const fill=gap.el.querySelector('.gym-inline-rest-fill');
    if(clock)clock.textContent=fmt(gap.remaining);
    if(fill)fill.style.width=`${Math.max(0,Math.min(100,gap.remaining/gap.duration*100))}%`;
    setPlayButton(gap.el.querySelector('.gym-inline-rest-toggle'),gap.running,playLabel(gap));
    gap.el.classList.toggle('is-running',gap.running);
    gap.el.classList.toggle('is-finished',gap.remaining===0);
  }
  function tick(){
    if(general.running){
      general.remaining=Math.max(0,Math.ceil((general.deadline-Date.now())/1000));
      if(general.remaining===0){general.running=false;general.paused=false;general.deadline=0;general.duration=defaultSeconds;general.remaining=defaultSeconds;completeRest('geral');}
      saveGeneral();renderGeneral();
    }
    if(gap.running){
      if(!gap.el?.isConnected){gap.running=false;cancelPush('series');}
      else {
        gap.remaining=Math.max(0,Math.ceil((gap.deadline-Date.now())/1000));
        if(gap.remaining===0){gap.running=false;gap.paused=false;gap.deadline=0;gap.remaining=gap.duration;completeRest('series');}
        renderGap();
      }
    }
    if(!general.running&&!gap.running&&ticker){clearInterval(ticker);ticker=null;}
  }
  function startTicker(){if(!ticker)ticker=setInterval(tick,220);}
  function pauseGeneral(){
    if(general.running){general.remaining=Math.max(0,Math.ceil((general.deadline-Date.now())/1000));general.running=false;general.paused=true;general.deadline=0;cancelPush('geral');}
    saveGeneral();renderGeneral();
  }
  function startGeneral(seriesSeconds){
    ensureAudio();
    if(general.running){pauseGeneral();return;}
    if(validSeconds(seriesSeconds)){general.duration=seriesSeconds;general.remaining=seriesSeconds;}
    if(general.remaining<=0)general.remaining=general.duration;
    general.deadline=Date.now()+general.remaining*1000;
    general.running=true;general.paused=false;saveGeneral();renderGeneral();startTicker();
    schedulePush('geral',general.deadline);
  }
  function resetGeneral(){
    pauseGeneral();general.paused=false;general.duration=defaultSeconds;general.remaining=defaultSeconds;general.deadline=0;
    cancelPush('geral');saveGeneral();renderGeneral();
  }
  function selectGap(element){
    if(gap.el===element)return;
    if(gap.running)cancelPush('series');
    setPlayButton(gap.el?.querySelector('.gym-inline-rest-toggle'),false,'Iniciar');
    gap.el=element;gap.running=false;gap.paused=false;gap.deadline=0;
    const saved=Number(element.dataset.restSeconds);
    gap.duration=validSeconds(saved)?saved:defaultSeconds;
    gap.remaining=gap.duration;renderGap();
  }
  function toggleGap(element){
    ensureAudio();selectGap(element);
    if(gap.running){gap.remaining=Math.max(0,Math.ceil((gap.deadline-Date.now())/1000));gap.running=false;gap.paused=true;gap.deadline=0;cancelPush('series');}
    else {
      if(gap.remaining<=0)gap.remaining=gap.duration;
      gap.running=true;gap.paused=false;gap.deadline=Date.now()+gap.remaining*1000;
      schedulePush('series',gap.deadline);startTicker();
    }
    renderGap();
  }
  function applyDurationToGap(node,seconds,isOverride){
    if(!node || !validSeconds(seconds))return;
    node.dataset.restSeconds=String(seconds);
    node.dataset.restOverride=isOverride?'true':'false';
    syncSlot(node.querySelector('.gym-rest-row'),seconds);
    const c=node.querySelector('.gym-inline-rest-clock');if(c)c.textContent=fmt(seconds);
    const fill=node.querySelector('.gym-inline-rest-fill');if(fill)fill.style.width='100%';
    if(gap.el===node){
      if(gap.running)cancelPush('series');
      gap.duration=seconds;gap.remaining=seconds;gap.running=false;gap.paused=false;gap.deadline=0;renderGap();
    }
  }
  function applyDefaultToGaps(){
    document.querySelectorAll('.gym-inline-rest').forEach(node=>{
      // Não apagar um tempo individual personalizado ao alterar o padrão do treino.
      if(node.dataset.restOverride!=='true')applyDurationToGap(node,defaultSeconds,false);
    });
  }
  function setDefault(value){
    if(!validSeconds(value))return;
    defaultSeconds=value;storage(REST_DEFAULT_KEY,value);
    resetGeneral();general.duration=value;general.remaining=value;
    saveGeneral();renderGeneral();
    syncSlot(getGlobal('gymGeneralRest')?.querySelector('.gym-rest-row'),value);
    applyDefaultToGaps();
  }
  function initializeGaps(root=document){
    const nodes=[];
    if(root.matches?.('.gym-inline-rest'))nodes.push(root);
    root.querySelectorAll?.('.gym-inline-rest').forEach(node=>nodes.push(node));
    nodes.forEach(node=>{
      if(node.hasAttribute('data-rest-initialized'))return;
      node.setAttribute('data-rest-initialized','true');
      const saved=Number(node.dataset.restSaved);
      if(validSeconds(saved))applyDurationToGap(node,saved,true);
      else applyDurationToGap(node,defaultSeconds,false);
      setPlayButton(node.querySelector('.gym-inline-rest-toggle'),false,'Iniciar');
    });
  }

  // Qualquer toque prepara o áudio: um descanso retomado ao reabrir a app não passa por Iniciar.
  document.addEventListener('touchend',ensureAudio,{passive:true});
  document.addEventListener('click',event=>{
    ensureAudio();
    if(event.target.closest('#gymGeneralStart')){startGeneral(null);return;}
    if(event.target.closest('#gymGeneralReset')){resetGeneral();return;}
    if(event.target.closest('#gymRestCompleteDismiss')){
      ++toastToken;clearTimeout(toastTimer);getGlobal('gymRestCompleteToast').hidden=true;return;
    }
    const t=event.target.closest('.gym-inline-rest-toggle,.gym-inline-rest-reset');
    if(t){const element=t.closest('.gym-inline-rest');if(!element)return;
      if(t.matches('.gym-inline-rest-reset')){
        selectGap(element);if(gap.running){gap.running=false;cancelPush('series');}
        gap.deadline=0;gap.paused=false;gap.remaining=gap.duration;renderGap();
      } else toggleGap(element);
      return;
    }
    // Ao concluir uma série já guardada, iniciar o descanso padrão do treino.
    // A escolha do peso ou das repetições não aciona qualquer relógio.
    const series=event.target.closest('.gym-series-complete');
    if(series){
      if(performance.now()-(window.__treinoGuardadoEm||-1000)<450)return;
      const wasDone=series.getAttribute('aria-pressed')==='true';
      series.setAttribute('aria-pressed',String(!wasDone));
      window.marcarSerie?.(series.dataset.serieChave,!wasDone);
      // Só arranca com o timer parado: outro check não pode reiniciar um descanso a contar ou em pausa.
      if(!wasDone){if(!general.running&&!general.paused)startGeneral(Number(series.dataset.descanso));showEncouragement(series);}
    }
    if(event.target.closest('[data-page="progress"]'))setTimeout(renderProgress,0);
  });
  const rowSeconds=row=>row.closest('#gymGeneralRest')?defaultSeconds:(Number(row.closest('.gym-inline-rest')?.dataset.restSeconds)||defaultSeconds);
  function applySeconds(row,seconds){
    const node=row.closest('.gym-inline-rest');
    if(row.closest('#gymGeneralRest'))setDefault(seconds);
    else if(node)applyDurationToGap(node,seconds,true);
  }
  const syncAllSlots=()=>document.querySelectorAll('.gym-rest-row').forEach(row=>syncSlot(row,rowSeconds(row)));
  function removeCustomTime(seconds){
    customTimes=customTimes.filter(v=>v!==seconds);storage(CUSTOM_TIMES_KEY,customTimes);
    if(defaultSeconds===seconds)setDefault(90);
    document.querySelectorAll('.gym-inline-rest').forEach(node=>{
      if(Number(node.dataset.restSeconds)===seconds)applyDurationToGap(node,defaultSeconds,false);
    });
    syncAllSlots();
  }
  const WHEEL_ROW=44;
  const wheelHtml=(label,max)=>`<div class="gym-wheel" role="spinbutton" tabindex="0" aria-label="${label}" aria-valuemin="0" aria-valuemax="${max}"><ul>${Array.from({length:max+1},(_,i)=>`<li>${String(i).padStart(2,'0')}</li>`).join('')}</ul></div>`;
  // Roda de minutos e segundos: arrasta-se com o dedo e encaixa em cada valor (scroll-snap).
  function chooseCustomTime(row){
    const previous=rowSeconds(row),origin=document.activeElement;
    const overlay=document.createElement('div');
    overlay.className='vf-dialog-overlay';
    overlay.innerHTML=`<div class="vf-dialog gym-wheel-dialog" role="dialog" aria-modal="true" aria-labelledby="gymWheelTitle">
      <h2 id="gymWheelTitle" class="vf-dialog-title">Escolhe o tempo</h2>
      <div class="gym-wheel-pair">${wheelHtml('Minutos',MAX_SECONDS_MINUTES)}<span aria-hidden="true">:</span>${wheelHtml('Segundos',59)}</div>
      <p class="gym-wheel-note" role="status"></p>
      <div class="vf-dialog-actions"><button type="button" class="vf-dialog-cancel">Cancelar</button><button type="button" class="vf-dialog-confirm">Guardar</button></div>
    </div>`;
    document.body.appendChild(overlay);
    const [minutes,secondsWheel]=overlay.querySelectorAll('.gym-wheel');
    const confirm=overlay.querySelector('.vf-dialog-confirm'),note=overlay.querySelector('.gym-wheel-note');
    const wheelValue=wheel=>Math.round(wheel.scrollTop/WHEEL_ROW);
    const total=()=>wheelValue(minutes)*60+wheelValue(secondsWheel);
    const refresh=()=>{
      const value=total(),repeated=choices.includes(value)||customTimes.includes(value);
      [minutes,secondsWheel].forEach(wheel=>{
        wheel.setAttribute('aria-valuenow',wheelValue(wheel));
        wheel.querySelectorAll('li').forEach((li,i)=>li.classList.toggle('is-selected',i===wheelValue(wheel)));
      });
      confirm.disabled=!validSeconds(value)||repeated;
      note.textContent=value<MIN_SECONDS?'Escolhe pelo menos 1 segundo.':value>MAX_SECONDS?'O máximo é 60:00.':repeated?`O tempo ${fmt(value)} já existe.`:'';
    };
    const close=()=>{
      document.removeEventListener('keydown',keys,true);
      overlay.classList.remove('open');
      setTimeout(()=>overlay.remove(),160);
      syncSlot(row,rowSeconds(row));
      if(origin?.isConnected)origin.focus({preventScroll:true});
    };
    const keys=event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
      else if((event.key==='ArrowUp'||event.key==='ArrowDown')&&event.target.matches('.gym-wheel')){
        event.preventDefault();
        event.target.scrollTop+=(event.key==='ArrowUp'?-1:1)*WHEEL_ROW;
      }
    };
    document.addEventListener('keydown',keys,true);
    [minutes,secondsWheel].forEach(wheel=>{
      wheel.addEventListener('scroll',refresh,{passive:true});
      wheel.addEventListener('click',event=>{
        const li=event.target.closest('li');
        if(li)wheel.scrollTo({top:[...li.parentElement.children].indexOf(li)*WHEEL_ROW,behavior:'smooth'});
      });
    });
    overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
    overlay.querySelector('.vf-dialog-cancel').addEventListener('click',close);
    confirm.addEventListener('click',()=>{
      const value=total();
      if(!validSeconds(value)||choices.includes(value)||customTimes.includes(value))return;
      customTimes.push(value);storage(CUSTOM_TIMES_KEY,customTimes);
      applySeconds(row,value);
      syncAllSlots();
      close();
    });
    minutes.scrollTop=Math.floor(previous/60)*WHEEL_ROW;
    secondsWheel.scrollTop=(previous%60)*WHEEL_ROW;
    refresh();
    requestAnimationFrame(()=>overlay.classList.add('open'));
    minutes.focus({preventScroll:true});
  }
  document.addEventListener('change',event=>{
    if(!event.target.matches('.gym-rest-select'))return;
    const row=event.target.closest('.gym-rest-row');
    if(event.target.value==='custom')chooseCustomTime(row);
    else applySeconds(row,Number(event.target.value));
  });
  document.addEventListener('vf-option-remove',event=>{
    if(event.target.matches('.gym-rest-select'))removeCustomTime(Number(event.detail));
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')tick();
  });
  const init=()=>{
    // Normalizar a duração restaurada, sem alterar o valor geral guardado.
    if(general.duration!==defaultSeconds&&!general.running&&!general.paused){general.duration=defaultSeconds;general.remaining=defaultSeconds;}
    saveGeneral();
    renderGeneral();initializeGaps();renderProgress();
    syncSlot(getGlobal('gymGeneralRest')?.querySelector('.gym-rest-row'),defaultSeconds);
    const observer=new MutationObserver(entries=>{
      entries.forEach(entry=>entry.addedNodes.forEach(node=>{
        if(node.nodeType===1)initializeGaps(node);
      }));
    });
    observer.observe(document.body,{childList:true,subtree:true});
    if(general.running){startTicker();tick();}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.regioesDoExercicio=regionsFor;
})();
