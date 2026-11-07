/* Resumo do treino em formato story: lê o plano guardado, calcula números e dá conselhos. */
(() => {
  'use strict';
  const DIAS = { segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta', quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo' };
  const num = v => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : 0; };
  // pesoHalter é por halter: o volume conta os dois.
  const pesoSerie = s => num(s?.carga) || num(s?.pesoHalter) * 2;
  const pesoMax = lista => Math.max(0, ...(lista || []).map(pesoSerie));
  const seriesDe = ex => Array.isArray(ex.seriesData) && ex.seriesData.length ? ex.seriesData : [];

  // Segunda-feira às 00:00 da semana de `agora`: o resumo de domingo cobre de segunda a domingo.
  function inicioSemana(agora = Date.now()) {
    const d = new Date(agora); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  }

  function calcularResumo(treinos, marcados, regionsFor, nomes, agora = Date.now()) {
    const r = { dias: [], treinos: 0, exercicios: 0, series: 0, feitas: 0, volume: 0, registos: 0, musculos: {}, evolucao: null, podio: [], momentos: [] };
    const semana = inicioSemana(agora);
    const chaves = new Set();
    Object.keys(DIAS).forEach(dia => {
      const lista = Array.isArray(treinos?.[dia]) ? treinos[dia] : [];
      let ativo = false;
      lista.forEach(t => (t.exercicios || []).forEach(ex => {
        ativo = true;
        r.exercicios++;
        const series = seriesDe(ex);
        const n = series.length || Math.max(1, num(ex.series));
        r.series += n;
        for (let i = 0; i < n; i++) chaves.add(`${t.id}|${ex.id ?? ex.nome}|${i}`);
        series.forEach(s => { r.volume += pesoSerie(s) * num(s.repeticoes); });
        regionsFor(ex).forEach(m => { r.musculos[m] = (r.musculos[m] || 0) + n; });
        const max = pesoMax(series);
        if (max) r.podio.push({ nome: ex.nome, peso: max });
        const hist = Array.isArray(ex.historico) ? ex.historico : [];
        // Melhores momentos: subidas de carga registadas esta semana.
        hist.forEach((h, i) => {
          if (i && num(h.id) >= semana) {
            const antes = pesoMax(hist[i - 1].seriesData), depois = pesoMax(h.seriesData);
            if (antes && depois > antes) r.momentos.push({ nome: ex.nome, de: antes, para: depois, quando: num(h.id) });
          }
        });
        r.registos += hist.length;
        if (hist.length > 1) {
          const ini = pesoMax(hist[0].seriesData), fim = pesoMax(hist[hist.length - 1].seriesData);
          if (ini && fim > ini) {
            const pct = Math.round(100 * (fim - ini) / ini);
            if (!r.evolucao || pct > r.evolucao.pct) r.evolucao = { nome: ex.nome, de: ini, para: fim, pct };
          }
        }
      }));
      r.treinos += lista.filter(t => (t.exercicios || []).length).length;
      if (ativo) r.dias.push(dia);
    });
    r.feitas = Object.keys(marcados || {}).filter(k => chaves.has(k)).length;
    r.volume = Math.round(r.volume);
    r.podio = r.podio.sort((a, b) => b.peso - a.peso).slice(0, 3);
    r.momentos.sort((a, b) => (b.para - b.de) / b.de - (a.para - a.de) / a.de);
    r.ranking = Object.entries(r.musculos).sort((a, b) => b[1] - a[1]);
    r.emFalta = Object.keys(nomes).filter(m => !r.musculos[m]);
    const soma = lista => lista.reduce((t, m) => t + (r.musculos[m] || 0), 0);
    r.empurrar = soma(['peito', 'ombros', 'triceps']);
    r.puxar = soma(['costas', 'biceps', 'trapezio']);
    r.pernas = soma(['quadriceps', 'posteriores', 'gluteos', 'gemeos']);
    return r;
  }

  // Escolha fixa durante a semana e sempre diferente da semana anterior (semana = segunda às 00:00).
  const nSemana = semana => Math.floor((semana + 3 * 864e5) / 6048e5);
  const escolhe = (opcoes, semana, sal = 0) => opcoes[(nSemana(semana) + sal * 3) % opcoes.length];

  const GERAIS = [
    ['Aquece primeiro', '5 a 10 minutos de cardio leve.'],
    ['Técnica antes do peso', 'Na dúvida, fala com um instrutor.'],
    ['Dorme bem', '7 a 9 horas ajudam o músculo a recuperar.'],
    ['Bebe água', 'Leva uma garrafa para o treino.'],
    ['Proteína em cada refeição', 'Ajuda a recuperar depois do treino.'],
    ['Respira', 'Expira no esforço, inspira ao voltar.'],
    ['Alonga no fim', '5 minutos de alongamentos suaves.'],
    ['Sobe aos poucos', 'Mais 1 ou 2 repetições antes de mais peso.'],
    ['Descansa entre séries', '1 a 3 minutos nos exercícios pesados.'],
    ['Ouve o teu corpo', 'Dor aguda é sinal para parar.']
  ];

  function conselhos(r, nomes, semana = 0) {
    const lista = [];
    const v = (opcoes, sal) => escolhe(opcoes, semana, sal);
    if (!r.pernas) lista.push(v([['Não saltes as pernas', 'Um treino por semana já faz diferença.'], ['Dia de pernas', 'Junta um agachamento ou leg press ao plano.']], 1));
    if (r.empurrar > 1.5 * r.puxar && r.empurrar >= 6) lista.push(v([['Mais costas', 'Equilibra o peito com remadas e puxadas.'], ['Puxa tanto como empurras', 'Uma remada a mais protege os ombros.']], 2));
    if (r.puxar > 1.5 * r.empurrar && r.puxar >= 6) lista.push(v([['Mais peito e ombros', 'Junta um supino ou um press.'], ['Empurra mais', 'Um supino equilibra as tuas costas.']], 3));
    if (r.emFalta.length && r.emFalta.length <= 5) lista.push([v(['Músculos esquecidos', 'Ainda por treinar'], 4), r.emFalta.map(m => nomes[m]).join(', ')]);
    if (!r.evolucao) lista.push(v([['Regista a evolução', 'Subiste o peso? Toca em «Atualizar».'], ['Mostra o que subiste', 'Usa «Atualizar» quando aumentares a carga.']], 5));
    if (r.dias.length >= 6) lista.push(v([['Descansa', 'Guarda pelo menos um dia livre.'], ['Recuperar também conta', 'Um dia de pausa ajuda o músculo a crescer.']], 6));
    if (r.dias.length && r.dias.length < 3) lista.push(v([['Mais um dia', 'Cada músculo duas vezes por semana.'], ['Treina mais vezes', 'Três dias por semana dão mais resultado.']], 7));
    if (r.series && r.feitas < r.series / 2) lista.push(v([['Marca as séries', 'Toca no círculo ao acabar cada uma.'], ['Conta cada série', 'Marca-as e vês aqui quanto fizeste.']], 8));
    // Gerais: completam a lista e rodam de semana para semana.
    const inicio = (nSemana(semana) * 3) % GERAIS.length;
    for (let i = 0; lista.length < 3; i++) lista.push(GERAIS[(inicio + i) % GERAIS.length]);
    return lista.slice(0, 3);
  }

  // «2 a 8 de novembro»: de segunda a domingo da semana de `agora`.
  function intervaloSemana(agora = Date.now()) {
    const ini = new Date(inicioSemana(agora)), fim = new Date(ini);
    fim.setDate(fim.getDate() + 6);
    const mes = d => d.toLocaleDateString('pt-PT', { month: 'long' });
    return ini.getMonth() === fim.getMonth() ? `${ini.getDate()} a ${fim.getDate()} de ${mes(fim)}` : `${ini.getDate()} de ${mes(ini)} a ${fim.getDate()} de ${mes(fim)}`;
  }

  // Guarda o resumo completo de cada semana: serve o rewind da semana seguinte e as comparações.
  // Só ficam as últimas 8 (alguns KB).
  const MAX_SEMANAS = 8;
  function registarSemana(guardadas, r, agora = Date.now()) {
    const todas = { ...(guardadas || {}), [inicioSemana(agora)]: r };
    return Object.fromEntries(Object.entries(todas).sort((a, b) => b[0] - a[0]).slice(0, MAX_SEMANAS));
  }
  const semanaAnterior = (guardadas, agora = Date.now()) => guardadas?.[inicioSemana(inicioSemana(agora) - 1)] || null;
  // Ao domingo vê-se a semana que está a acabar; de segunda a sábado, continua a ver-se essa.
  const semanaVisivel = (agora = Date.now()) => new Date(agora).getDay() === 0 ? inicioSemana(agora) : inicioSemana(inicioSemana(agora) - 1);
  // Dia do mês do próximo domingo (o próprio domingo conta como «hoje», o próximo é daqui a 7 dias).
  function proximoDomingo(agora = Date.now()) {
    const d = new Date(agora);
    d.setDate(d.getDate() + 7 - d.getDay());
    return d.getDate();
  }

  // --- story ---
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = n => Number(n).toLocaleString('pt-PT');
  const kg = n => `${fmt(Math.round(n * 10) / 10)} kg`;
  const conta = (n, sufixo = '') => `<b class="vf-story-count" data-alvo="${n}" data-sufixo="${esc(sufixo)}">${fmt(n)}${esc(sufixo)}</b>`;
  const entra = (html, i, tag = 'div', cls = '') => `<${tag} class="vf-story-in ${cls}" style="--d:${i * 140}ms">${html}</${tag}>`;
  const ICONES = {
    calendario: '<path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>',
    peso: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
    seta: '<path d="M4 17l6-6 4 4 6-7M14 8h6v6"/>',
    alvo: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',
    lampada: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>'
  };
  const icone = n => `<svg class="vf-i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[n]}</svg>`;

  // Etiqueta «▲ +3 séries vs semana passada»; sem semana passada guardada não mostra nada.
  function compara(agora, antes, unidade) {
    if (antes == null) return '';
    if (Array.isArray(antes)) antes = antes.length;
    const d = agora - antes;
    if (!d) return '<span class="vf-story-delta">= igual à semana passada</span>';
    const valor = unidade === '%' ? (antes ? `${Math.round(100 * Math.abs(d) / antes)}%` : `${fmt(Math.abs(d))} kg`) : `${fmt(Math.abs(d))} ${unidade}${Math.abs(d) === 1 ? '' : 's'}`;
    return `<span class="vf-story-delta ${d > 0 ? 'is-up' : 'is-down'}">${d > 0 ? '▲ +' : '▼ −'}${valor} vs semana passada</span>`;
  }

  function slides(r, nomes, antes, semana) {
    const s = [];
    // Frase do autocolante: depende do que o story mostra e muda de semana para semana.
    const f = (opcoes, sal) => escolhe(opcoes, semana, sal);
    const pctFeito = r.series ? Math.round(100 * r.feitas / r.series) : 0;
    s.push({ tema: 'abertura', html: `${entra('Resumo da semana', 0, 'p', 'vf-story-eyebrow')}${entra('A tua semana', 1, 'h2', 'vf-story-title')}${entra(intervaloSemana(semana), 2, 'p')}${entra('<span></span><span></span><span></span>', 3, 'div', 'vf-story-orbs')}` });
    if (!r.exercicios) {
      s.push({ tema: 'rosa', frase: f(['Vamos a isso!', 'Hoje é um bom dia!'], 1), html: `${entra(icone('calendario'), 0, 'div', 'vf-story-icon')}${entra('Ainda sem treinos', 1, 'h2')}${entra('<button type="button" class="vf-story-cta" data-story-ir="workout">Criar treino</button>', 2)}` });
    } else {
      s.push({ tema: 'roxo', frase: r.dias.length >= 4 ? f(['Semana cheia!', 'Que dedicação!', 'Plano a sério!'], 2) : f(['Bom começo!', 'Passo a passo!', 'Cada dia conta!'], 2), html: `${entra('O teu plano', 0, 'p', 'vf-story-eyebrow')}${entra(`${conta(r.dias.length)}<span>${r.dias.length === 1 ? 'dia' : 'dias'} por semana</span>`, 1, 'div', 'vf-story-big')}${entra(r.dias.map(d => `<span>${DIAS[d]}</span>`).join(''), 2, 'div', 'vf-story-chips')}${entra(`<div><b>${fmt(r.exercicios)}</b><span>exercícios</span></div><div><b>${fmt(r.series)}</b><span>séries</span></div>`, 3, 'div', 'vf-story-trio')}${entra(compara(r.dias.length, antes?.dias, 'dia'), 4)}` });
      const pct = r.series ? Math.min(100, Math.round(100 * r.feitas / r.series)) : 0;
      s.push({ tema: 'turquesa', frase: pctFeito >= 100 ? f(['Semana completa!', 'Nada ficou por fazer!', 'Isto é consistência!'], 3) : pctFeito >= 50 ? f(['Foste bem!', 'Boa!', 'Mais de metade!'], 3) : r.feitas ? f(['Cada série conta!', 'Bom arranque!', 'Já é um começo!'], 3) : f(['Nova semana, nova chance!', 'Recomeça hoje!'], 3), html: `${entra('Séries feitas', 0, 'p', 'vf-story-eyebrow')}${entra(`<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle class="vf-story-ring-fill" cx="60" cy="60" r="52" pathLength="100" style="--pct:${pct}"/></svg><div>${conta(pct, '%')}<span>feito</span></div>`, 1, 'div', 'vf-story-ring')}${entra(`${fmt(r.feitas)} de ${fmt(r.series)} séries`, 2, 'h2')}${entra(compara(r.feitas, antes?.feitas, 'série'), 3)}` });
      if (r.volume) {
        // 1200 kg: peso típico de um carro pequeno.
        const carros = Math.round(r.volume / 120) / 10;
        s.push({ tema: 'rosa', frase: antes?.volume != null && r.volume < antes.volume ? f(['Semana mais leve, tudo bem!', 'Recuperar também conta!'], 4) : f(['Que força!', 'Subiste a fasquia!', 'Toneladas de esforço!'], 4), html: `${entra('Peso levantado', 0, 'p', 'vf-story-eyebrow')}${entra(`${conta(r.volume)}<span>kg por semana</span>`, 1, 'div', 'vf-story-big')}${carros >= 1 ? entra(`≈ <b>${fmt(carros)}</b> ${carros < 2 ? 'carro' : 'carros'}`, 2, 'p', 'vf-story-fun') : ''}${entra(compara(r.volume, antes?.volume, '%'), 3)}` });
      }
      if (r.podio.length) {
        const lugares = r.podio.length === 3 ? [1, 0, 2] : r.podio.map((_, i) => i);
        s.push({ tema: 'escuro', duracao: 8000, frase: r.momentos.length ? f(['Recorde!', 'Mais forte que a semana passada!', 'Que subida!'], 5) : f(['Que cargas!', 'Pódio merecido!', 'Respeito!'], 5), html: `${entra('Melhores momentos', 0, 'p', 'vf-story-eyebrow')}${entra(lugares.map(i => `<div class="vf-story-step is-${i + 1}" style="--d:${450 + (2 - i) * 160}ms"><em>${esc(r.podio[i].nome)}</em><b>${kg(r.podio[i].peso)}</b><span>${i + 1}</span></div>`).join(''), 1, 'div', 'vf-story-podium')}${r.momentos.length ? entra(r.momentos.slice(0, 2).map(m => `<div>${icone('seta')}<b>${esc(m.nome)}</b><em>${kg(m.de)} → ${kg(m.para)}</em></div>`).join(''), 2, 'div', 'vf-story-moments') : ''}` });
      }
      if (r.ranking.length) {
        const topo = r.ranking[0][1];
        s.push({ tema: 'roxo', frase: f(['Bem trabalhado!', 'Foco total!', 'Sentiste este?'], 6), html: `${entra('Músculo de eleição', 0, 'p', 'vf-story-eyebrow')}${entra(esc(nomes[r.ranking[0][0]]), 1, 'h2', 'vf-story-title')}${entra(r.ranking.slice(0, 4).map(([m, n], i) => `<div class="vf-story-bar" style="--w:${Math.round(100 * n / topo)}%;--d:${500 + i * 120}ms"><b>${esc(nomes[m])}</b><span><i></i></span><em>${n}</em></div>`).join(''), 2, 'div', 'vf-story-bars')}` });
      }
      s.push(r.evolucao
        ? { tema: 'verde', frase: f(['Estás a evoluir!', 'Orgulha-te disto!', 'Grande salto!'], 7), html: `${entra('Maior evolução', 0, 'p', 'vf-story-eyebrow')}${entra(`+${conta(r.evolucao.pct, '%')}`, 1, 'div', 'vf-story-big vf-story-big-solo')}${entra(esc(r.evolucao.nome), 2, 'h2')}${entra(`${kg(r.evolucao.de)} → ${kg(r.evolucao.para)}`, 3, 'p')}` }
        : { tema: 'verde', frase: f(['A próxima subida é tua!', 'Vai mais longe!'], 7), html: `${entra('Evolução', 0, 'p', 'vf-story-eyebrow')}${entra(icone('seta'), 1, 'div', 'vf-story-icon')}${entra('Subiste o peso? Toca em «Atualizar»', 2, 'h2')}` });
      const equilibrio = r.empurrar + r.puxar + r.pernas;
      if (equilibrio) {
        const parte = n => Math.round(100 * n / equilibrio);
        s.push({ tema: 'turquesa', frase: !r.emFalta.length ? f(['Corpo completo!', 'Nada esquecido!'], 8) : r.emFalta.length <= 3 ? f(['Quase completo!', 'Falta pouco!'], 8) : f(['Há espaço para mais!', 'Vamos completar!'], 8), html: `${entra('Equilíbrio', 0, 'p', 'vf-story-eyebrow')}${entra([['Empurrar', r.empurrar], ['Puxar', r.puxar], ['Pernas', r.pernas]].map(([t, n], i) => `<div class="vf-story-bar" style="--w:${parte(n)}%;--d:${400 + i * 140}ms"><b>${t}</b><span><i></i></span><em>${parte(n)}%</em></div>`).join(''), 1, 'div', 'vf-story-bars is-split')}${r.emFalta.length ? entra(`<span>Por treinar</span>${r.emFalta.map(m => `<i>${esc(nomes[m])}</i>`).join('')}`, 2, 'div', 'vf-story-missing') : ''}` });
      }
    }
    s.push({ tema: 'escuro', duracao: 8000, frase: f(['Toma nota!', 'Dicas para ti!', 'Para a próxima semana!'], 9), html: `${entra(`${icone('lampada')} Conselhos`, 0, 'p', 'vf-story-eyebrow')}${conselhos(r, nomes, semana).map(([t, d], i) => entra(`<b>${esc(t)}</b><span>${esc(d)}</span>`, i + 1, 'div', 'vf-story-tip')).join('')}` });
    s.push({ tema: 'abertura', frase: r.exercicios ? f(['Até domingo!', 'Mais forte a cada treino!', 'Continua!'], 10) : f(['Vamos a isso!', 'O primeiro passo conta!'], 10), html: `${entra(icone('alvo'), 0, 'div', 'vf-story-icon')}${entra(r.exercicios ? 'Continua assim' : 'Começa hoje', 1, 'h2', 'vf-story-title')}${entra(`Vemo-nos domingo, dia ${proximoDomingo()}!`, 2, 'p', 'vf-story-fun')}${entra('<button type="button" class="vf-story-cta" data-story-repetir>Ver outra vez</button><button type="button" class="vf-story-cta is-ghost" data-story-fechar>Fechar</button>', 3, 'div', 'vf-story-actions')}` });
    return s;
  }

  const DURACAO = 6500;
  let root = null, lista = [], atual = 0, inicio = 0, gasto = 0, pausa = false, frame = 0, origem = null, premido = 0, longo = false;
  const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function contar(el) {
    el.querySelectorAll('.vf-story-count').forEach(n => {
      const alvo = Number(n.dataset.alvo), suf = n.dataset.sufixo || '';
      if (reduzido()) return;
      const t0 = performance.now();
      const passo = t => {
        const p = Math.min(1, (t - t0) / 1100), v = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
        n.textContent = fmt(v) + suf;
        if (p < 1 && root) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }

  function mostrar(i) {
    atual = Math.max(0, Math.min(lista.length - 1, i));
    gasto = 0; inicio = performance.now();
    const palco = root.querySelector('.vf-story-stage');
    palco.className = `vf-story-stage is-${lista[atual].tema}`;
    const frase = lista[atual].frase ? `<span class="vf-story-hype" aria-hidden="true">${esc(lista[atual].frase)}</span>` : '';
    palco.innerHTML = `${frase}<div class="vf-story-slide">${lista[atual].html}</div>`;
    palco.setAttribute('aria-label', `Página ${atual + 1} de ${lista.length}`);
    root.querySelectorAll('.vf-story-seg').forEach((b, n) => { b.classList.toggle('is-done', n < atual); b.style.setProperty('--p', n < atual ? 1 : 0); });
    contar(palco);
  }

  function tick(t) {
    if (!root) return;
    const dur = lista[atual].duracao || DURACAO;
    const p = Math.min(1, (gasto + (pausa ? 0 : t - inicio)) / dur);
    root.querySelectorAll('.vf-story-seg')[atual]?.style.setProperty('--p', p);
    if (p >= 1) { if (atual < lista.length - 1) mostrar(atual + 1); else { gasto = dur; pausa = true; } }
    frame = requestAnimationFrame(tick);
  }

  function setPausa(v) {
    if (v === pausa) return;
    if (v) gasto += performance.now() - inicio; else inicio = performance.now();
    pausa = v;
    root?.classList.toggle('is-paused', v);
    root?.querySelector('.vf-story-pause')?.setAttribute('aria-label', v ? 'Continuar' : 'Pausar');
  }

  // true: rewind semanal (domingo abre a semana atual, que fica até ao domingo seguinte).
  // false, ou ?resumo na morada: mostra sempre a semana atual (testes e demonstrações).
  const SO_DOMINGO = true;
  const semanaAMostrar = () => SO_DOMINGO && !new URLSearchParams(location.search).has('resumo') ? semanaVisivel() : inicioSemana();

  // Ainda sem resumo para ver: mostra o que vai ter, com exemplos. Sem treinos termina em «Como começar»;
  // com treinos, em «O teu progresso está a ser construído».
  function apresentacao(temTreinos) {
    const faltam = 7 - new Date().getDay();
    const exemplo = entra('Exemplo', 0, 'p', 'vf-story-sample');
    return [
      { tema: 'abertura', html: `${entra('Novo', 0, 'p', 'vf-story-eyebrow')}${entra('O teu resumo semanal', 1, 'h2', 'vf-story-title')}${entra(temTreinos ? `O primeiro chega domingo, dia ${proximoDomingo()}.` : 'Todos os domingos, a tua semana em stories.', 2, 'p')}${entra('<span></span><span></span><span></span>', 3, 'div', 'vf-story-orbs')}` },
      { tema: 'turquesa', frase: 'Vais ver isto!', html: `${exemplo}${entra('Quanto treinaste', 1, 'h2')}${entra('<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle class="vf-story-ring-fill" cx="60" cy="60" r="52" pathLength="100" style="--pct:75"/></svg><div><b>75%</b><span>feito</span></div>', 2, 'div', 'vf-story-ring')}${entra('Séries feitas e peso levantado, comparados com a semana anterior.', 3, 'p')}` },
      { tema: 'escuro', frase: 'Que cargas!', html: `${exemplo}${entra('Os teus melhores momentos', 1, 'h2')}${entra([[2, '?'], [1, '?'], [3, '?']].map(([i, v]) => `<div class="vf-story-step is-${i}" style="--d:${450 + (3 - i) * 160}ms"><em>Exercício</em><b>${v} kg</b><span>${i}</span></div>`).join(''), 2, 'div', 'vf-story-podium')}${entra('As cargas mais altas e as subidas da semana.', 3, 'p')}` },
      { tema: 'verde', frase: 'Feito para ti!', html: `${exemplo}${entra('Conselhos para ti', 1, 'h2')}${entra('<b>Equilíbrio do plano</b><span>Músculos esquecidos e o que falta treinar.</span>', 2, 'div', 'vf-story-tip')}${entra('<b>Dicas da semana</b><span>Diferentes todas as semanas.</span>', 3, 'div', 'vf-story-tip')}` },
      temTreinos
        ? { tema: 'abertura', frase: 'Continua!', duracao: 60000, html: `${entra(`<b>${faltam}</b><span>${faltam === 1 ? 'dia' : 'dias'} para domingo</span>`, 0, 'div', 'vf-story-countdown')}${entra('O teu progresso está a ser construído', 1, 'h2')}${entra(`Continua a treinar e desfruta da caminhada. Vemo-nos domingo, dia ${proximoDomingo()}!`, 2, 'p')}${entra('<button type="button" class="vf-story-cta" data-story-ir="workout">Ir treinar</button>', 3, 'div', 'vf-story-actions')}` }
        : { tema: 'roxo', frase: 'Vamos a isso!', html: `${entra('Como começar', 0, 'p', 'vf-story-eyebrow')}${entra(['Cria um treino em «Meu treino»', 'Marca cada série ao acabar', 'Ao domingo, vê o teu resumo'].map((t, i) => `<div><span>${i + 1}</span><b>${t}</b></div>`).join(''), 1, 'div', 'vf-story-steps')}${entra(`Vemo-nos domingo, dia ${proximoDomingo()}!`, 2, 'p', 'vf-story-fun')}${entra('<button type="button" class="vf-story-cta" data-story-ir="workout">Criar o primeiro treino</button>', 3, 'div', 'vf-story-actions')}` }
    ];
  }

  // O botão ganha um ponto quando há rewind para ver.
  function legenda() {
    const semana = semanaAMostrar();
    document.getElementById('progressStoryOpen')?.classList.toggle('is-ready', semana === inicioSemana() || Boolean(lerSemanas()[semana]?.ranking));
  }

  const STORAGE_SEMANAS = 'vf_resumo_semanas_v1';
  const lerSemanas = () => { try { return JSON.parse(localStorage.getItem(STORAGE_SEMANAS)) || {}; } catch (_) { return {}; } };
  // Calcula a semana atual e guarda-a; chamada ao abrir a app, ao marcar séries e ao sair.
  function atualizarSemana() {
    const m = window.vfMusculos;
    const marcados = typeof checksDaSemana === 'function' ? checksDaSemana() : {};
    const r = calcularResumo(typeof treinos !== 'undefined' ? treinos : {}, marcados, m ? m.regionsFor : () => [], m ? m.REGIONS : {});
    try { localStorage.setItem(STORAGE_SEMANAS, JSON.stringify(registarSemana(lerSemanas(), r))); } catch (_) {}
    return r;
  }

  function abrir(botao) {
    if (root) return;
    const m = window.vfMusculos;
    const atual = atualizarSemana(), guardadas = lerSemanas(), semana = semanaAMostrar();
    // Semanas guardadas por versões antigas só têm totais: não chegam para o rewind.
    const r = semana === inicioSemana() ? atual : guardadas[semana]?.ranking ? guardadas[semana] : null;
    lista = r?.exercicios ? slides(r, m ? m.REGIONS : {}, semanaAnterior(guardadas, semana), semana) : apresentacao(atual.exercicios > 0);
    origem = botao || document.activeElement;
    root = document.createElement('div');
    root.className = 'vf-story';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'O teu resumo de treino');
    root.innerHTML = `<div class="vf-story-frame">
      <div class="vf-story-bars-top">${lista.map(() => '<span class="vf-story-seg"><i></i></span>').join('')}</div>
      <div class="vf-story-head"><span class="vf-story-avatar"><img src="assets/vila-flor-flor-branca.png" alt=""></span><b>Ginásio Vila Flor</b><em>Resumo</em>
        <button type="button" class="vf-story-pause" aria-label="Pausar">${'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>'}</button>
        <button type="button" class="vf-story-close" data-story-fechar aria-label="Fechar resumo"><svg class="vf-i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="vf-story-stage" aria-live="polite"></div>
      <button type="button" class="vf-story-nav is-prev" aria-label="Anterior"></button>
      <button type="button" class="vf-story-nav is-next" aria-label="Seguinte"></button>
    </div>`;
    document.body.appendChild(root);
    document.body.classList.add('vf-story-open');
    pausa = false;
    mostrar(0);
    frame = requestAnimationFrame(tick);
    root.querySelector('.vf-story-close').focus();
  }

  function fechar() {
    if (!root) return;
    cancelAnimationFrame(frame);
    root.remove(); root = null;
    document.body.classList.remove('vf-story-open');
    origem?.focus?.();
  }

  document.addEventListener('click', e => {
    const abre = e.target.closest('#progressStoryOpen');
    if (abre) return abrir(abre);
    if (!root || !root.contains(e.target)) return;
    // Segurar para pausar não pode avançar ao largar o dedo.
    if (longo && e.target.closest('.vf-story-nav')) { longo = false; return; }
    if (e.target.closest('[data-story-fechar]')) return fechar();
    if (e.target.closest('[data-story-repetir]')) { setPausa(false); return mostrar(0); }
    const ir = e.target.closest('[data-story-ir]');
    if (ir) { fechar(); if (typeof mostrarPagina === 'function') mostrarPagina(ir.dataset.storyIr); return; }
    if (e.target.closest('.vf-story-pause')) { setPausa(!pausa); return; }
    if (e.target.closest('.vf-story-nav.is-prev')) mostrar(atual - 1);
    else if (e.target.closest('.vf-story-nav.is-next')) { if (atual < lista.length - 1) mostrar(atual + 1); else fechar(); }
  });
  document.addEventListener('pointerdown', e => { if (root && e.target.closest('.vf-story-nav')) { premido = performance.now(); setPausa(true); } });
  document.addEventListener('pointerup', e => { if (root && premido && e.target.closest('.vf-story-nav')) { longo = performance.now() - premido > 350; premido = 0; setPausa(false); } });
  document.addEventListener('keydown', e => {
    if (!root) return;
    if (e.key === 'Escape') fechar();
    else if (e.key === 'ArrowRight') mostrar(atual + 1);
    else if (e.key === 'ArrowLeft') mostrar(atual - 1);
    else if (e.key === 'Tab') {
      // Mantém o foco dentro do story.
      const f = [...root.querySelectorAll('button')].filter(b => b.offsetParent);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (root) setPausa(true);
    atualizarSemana();
  });
  // Depois de treino.js gravar o check da série.
  document.addEventListener('click', e => { if (e.target.closest('.gym-series-complete, #saveExercise')) setTimeout(atualizarSemana, 0); });
  const iniciar = () => { atualizarSemana(); legenda(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true }); else iniciar();
  window.vfResumo = { calcularResumo, conselhos, abrir };
})();
