const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/exercises/videos/manifest.json'), 'utf8'));
let fetchCalls = 0;
const assignedVideoSources = [];
const createdVideos = [];

function makeClassList() {
  const names = new Set();
  return {
    add(...items) { items.forEach(x => names.add(x)); },
    remove(...items) { items.forEach(x => names.delete(x)); },
    contains(item) { return names.has(item); }
  };
}

function makeElement(tagName) {
  const events = {};
  const node = {
    tagName: tagName.toUpperCase(),
    className: '',
    classList: makeClassList(),
    children: [],
    parentNode: null,
    isConnected: true,
    attributes: {},
    style: {},
    hidden: false,
    textContent: '',
    innerHTML: '',
    muted: false,
    defaultMuted: false,
    loop: false,
    autoplay: false,
    playsInline: false,
    preload: '',
    controls: false,
    paused: true,
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) {
      delete this.attributes[name];
      if (name === 'src') this._src = '';
    },
    addEventListener(name, callback) { (events[name] ||= []).push(callback); },
    dispatch(name) { (events[name] || []).forEach(callback => callback()); },
    load() { this.loadCount = (this.loadCount || 0) + 1; },
    play() { this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; },
    remove() {
      if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(item => item !== this);
      this.parentNode = null;
      this.isConnected = false;
    },
    replaceChildren(...items) {
      this.children.forEach(child => { child.parentNode = null; child.isConnected = false; });
      this.children = items;
      items.forEach(child => { child.parentNode = this; child.isConnected = this.isConnected; });
      this.innerHTML = '';
    },
    querySelectorAll(selector) {
      if (selector === 'video') return this.children.filter(child => child.tagName === 'VIDEO');
      return [];
    },
    querySelector(selector) {
      if (selector === '.exercise-modal-loading') return this.children.find(child => String(child.className).includes('exercise-modal-loading')) || null;
      if (selector === 'video') return this.children.find(child => child.tagName === 'VIDEO') || null;
      if (selector === '.vf-demo-loader-label') return makeElement('span');
      return null;
    }
  };
  Object.defineProperty(node, 'src', {
    get() { return this._src || ''; },
    set(value) {
      this._src = String(value);
      if (tagName.toLowerCase() === 'video' && this._src) assignedVideoSources.push(this._src);
    }
  });
  if (tagName.toLowerCase() === 'video') createdVideos.push(node);
  return node;
}

const elements = new Map();
for (const id of [
  'exerciseModalOverlay', 'exerciseModalVideo', 'exerciseModalTag', 'exerciseModalTitle',
  'exerciseModalEquipment', 'exerciseModalSteps', 'exerciseModalStepsSection',
  'exerciseModalCare', 'exerciseModalCareSection', 'exerciseModalClose'
]) elements.set(id, makeElement('div'));
const overlay = elements.get('exerciseModalOverlay');
overlay.querySelectorAll = selector => selector === 'video' ? elements.get('exerciseModalVideo').querySelectorAll('video') : [];
const document = {
  body: { style: {} },
  addEventListener() {},
  getElementById(id) { return elements.get(id) || null; },
  createElement(tagName) { return makeElement(tagName); },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};
const context = {
  window: { scrollTo() {} },
  location: { protocol: 'https:' },
  document,
  console,
  fetch(url, options) {
    fetchCalls += 1;
    assert.equal(url, 'assets/exercises/videos/manifest.json');
    assert.equal(options.cache, 'no-store');
    return Promise.resolve({ ok: true, json: () => Promise.resolve(manifest) });
  }
};
vm.createContext(context);

// Na página, js/treino.js carrega antes e fornece estes utilitários.
const treinoSource = fs.readFileSync(path.join(root, 'js/treino.js'), 'utf8');
for (const nome of ['normalizarTexto', 'escapeHtml']) {
  vm.runInContext(treinoSource.match(new RegExp(`function ${nome}\\([\\s\\S]*?\\n\\}`))[0], context);
}
const librarySource = fs.readFileSync(path.join(root, 'js/exercicios.js'), 'utf8');
vm.runInContext(librarySource + '\n;globalThis.__openExercise = abrirExercicioModal; globalThis.__closeExercise = fecharExercicioModal; globalThis.__validVideoPath = validarCaminhoVideoExercicio;', context);
const equipmentSource = fs.readFileSync(path.join(root, 'js/equipamentos.js'), 'utf8');
vm.runInContext(equipmentSource + '\n;globalThis.__equipment = EQUIPAMENTOS_EXERCICIOS; globalThis.__getAllExercises = obterTodosExerciciosBiblioteca; globalThis.__prepareLibraryExercise = prepararExercicioBiblioteca; globalThis.__renderExerciseCard = gerarCartaoExercicio; globalThis.__equipmentQR = EQUIPAMENTOS_QR; globalThis.__resolveEquipmentQR = equipamentoQRCodePorValor;', context);

(async () => {
  const all = context.__getAllExercises();
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const normalizedNames = all.map(ex => normalize(ex.nome));
  assert.equal(new Set(normalizedNames).size, all.length, 'O catálogo global deve conter nomes únicos após normalização.');
  const qrEquipamentos = context.__equipmentQR;
  assert.equal(context.__equipment["Banco de Peso"], undefined, 'O Banco de Peso já não deve existir como equipamento independente.');
  assert.ok(Array.isArray(context.__equipment["Peso Livre"]), 'Os exercícios migrados devem pertencer a Peso Livre.');
  const nomesPesoLivre = new Set((context.__equipment["Peso Livre"] || []).map(ex => normalize(ex.nome)));
  for (const nome of [
    "Supino Reto", "Supino inclinado com pesos livres", "Remada com Halteres",
    "Bíceps com Halteres", "Press de ombros com halteres", "Crucifixo com halteres",
    "Remada inclinada com halteres", "Rosca inclinada com halteres", "Agachamento búlgaro"
  ]) {
    assert.ok(nomesPesoLivre.has(normalize(nome)), `O exercício migrado deve estar em Peso Livre: ${nome}`);
  }
  assert.equal(context.__resolveEquipmentQR('banco-de-peso')?.label, 'Peso Livre', 'QR antigo do banco deve abrir Peso Livre por compatibilidade.');
  assert.equal(qrEquipamentos.length, 13, 'Deve existir um QR Code para cada um dos 13 equipamentos visíveis.');
  assert.equal(new Set(qrEquipamentos.map(eq => eq.slug)).size, 13, 'Os QR Codes devem usar slugs únicos.');
  for (const item of qrEquipamentos) {
    assert.equal(context.__resolveEquipmentQR(item.slug)?.label, item.label, `O slug deve abrir o equipamento correto: ${item.label}`);
    assert.equal(context.__resolveEquipmentQR(item.label)?.label, item.label, `O nome deve resolver para o equipamento correto: ${item.label}`);
  }
  const qrManifest = JSON.parse(fs.readFileSync(path.join(root, 'qr-codes/manifest.json'), 'utf8'));
  assert.equal(qrManifest.baseUrl, 'https://ginasio-vila-flor.vercel.app/', 'Os QR Codes devem usar o endereço Vercel fornecido.');
  assert.equal(qrManifest.equipments.length, qrEquipamentos.length, 'O manifesto deve incluir todos os equipamentos configurados na aplicação.');
  assert.ok(!qrManifest.equipments.some(item => item.label === 'Banco de Peso'), 'O banco removido não deve ter QR Code novo.');
  for (const item of qrManifest.equipments) {
    assert.ok(fs.existsSync(path.join(root, 'qr-codes', item.file)), `Imagem de QR em falta para ${item.label}`);
    assert.equal(item.url, `${qrManifest.baseUrl}?equipamento=${item.slug}`, `URL incorreto no QR de ${item.label}`);
    assert.equal(qrEquipamentos.find(eq => eq.slug === item.slug)?.label, item.label, `O QR deve apontar para o equipamento certo: ${item.label}`);
  }
  assert.equal(context.__resolveEquipmentQR('smith-machine')?.catalogKey, 'Smith Machine', 'O QR da Smith deve resolver para o catálogo da Smith Machine.');
  assert.equal(context.__resolveEquipmentQR('maquina-abdutora')?.catalogKey, 'Máquina Abdutora/Adutora', 'A página da máquina abdutora deve resolver a chave histórica do catálogo.');
  assert.equal(fetchCalls, 0, 'Abrir a biblioteca/catalogar exercícios não deve pedir o manifesto de vídeos.');
  assert.equal(assignedVideoSources.length, 0, 'Nenhum src de vídeo deve ser atribuído antes de abrir um exercício.');
  assert.ok(all.length > 0, 'A biblioteca visual deve conter exercícios com demonstração local e imagem específica.');
  for (const exercise of all) {
    assert.ok(exercise.videoId, `Exercício visível sem ID de demonstração: ${exercise.nome}`);
    assert.ok(exercise.imagemBiblioteca, `Exercício visível sem imagem: ${exercise.nome}`);
    assert.ok(fs.existsSync(path.join(root, exercise.imagemBiblioteca.split('?')[0])), `Imagem em falta: ${exercise.imagemBiblioteca}`);
  }
  const exampleCard = context.__renderExerciseCard(all[0], 0, 'exercise-library-card');
  assert.ok(exampleCard.includes(all[0].imagemBiblioteca), 'Cada cartão deve renderizar a imagem correspondente do exercício.');
  assert.ok(exampleCard.includes(all[0].nome), 'Cada cartão deve manter o nome do exercício.');
  assert.ok(exampleCard.includes('Ver exercício'), 'O botão/ação Ver exercício deve continuar presente.');
  assert.ok(exampleCard.includes(all[0].equipamento), 'A informação do equipamento deve continuar visível.');
  assert.ok(!exampleCard.includes('exercise-catalog-group'), 'As etiquetas de grupo muscular devem ser removidas dos cartões.');
  assert.ok(!exampleCard.includes('is-placeholder'), 'Os cartões não devem gerar placeholders vazios.');

  assert.equal(context.__validVideoPath('../videos/agachamento.mp4'), '', 'O validador deve rejeitar caminhos fora da pasta de vídeos.');
  assert.equal(context.__validVideoPath('assets&#x73;**/videos/agachamento.mp4'), '', 'O validador deve rejeitar caminhos corrompidos com entidades HTML/Markdown.');

  const videoItems = manifest.localVideos;
  assert.equal(videoItems.length, 64, 'Devem existir 64 demonstrações locais confirmadas.');
  assert.equal(new Set(videoItems.map(x => x.id)).size, videoItems.length, 'Os IDs das demonstrações devem ser únicos.');
  assert.equal(new Set(videoItems.map(x => x.file)).size, videoItems.length, 'Cada ficheiro deve ter uma única entrada no manifesto.');

  for (const entry of videoItems) {
    assert.ok(fs.existsSync(path.join(root, entry.file)), `Ficheiro de vídeo em falta: ${entry.file}`);
    const imageFile = `assets/ImagesExer/${path.basename(entry.file, path.extname(entry.file))}.jpg`;
    assert.ok(fs.existsSync(path.join(root, imageFile)), `Imagem específica em falta para ${entry.exercise}: ${imageFile}`);
    assert.equal(context.__validVideoPath(entry.file), entry.file, `O validador deve aceitar o caminho: ${entry.file}`);
    const found = all.find(ex => ex.videoId === entry.id);
    assert.ok(found, `Exercício com videoId não encontrado no catálogo: ${entry.id} (${entry.exercise})`);
    assert.equal(found.imagemBiblioteca.split('?')[0], imageFile, `A imagem deve corresponder ao vídeo de ${entry.exercise}.`);
    assert.equal(found.videoLocal, entry.file, `O cartão deve manter a demonstração correta de ${entry.exercise}.`);
    for (const eq of entry.equipment) {
      assert.ok((found.equipamentos || []).some(actual => normalize(actual) === normalize(eq)), `Equipamento não associado para ${entry.exercise}: ${eq}`);
      assert.ok((context.__equipment[eq] || []).some(ex => ex.videoId === entry.id), `O exercício não aparece no equipamento ${eq}: ${entry.exercise}`);
    }
  }

  assert.equal(context.__equipment['Smith Machine'].filter(ex => ex.videoId).length, 6, 'A Smith Machine deve apresentar seis vídeos compatíveis.');
  assert.equal(context.__equipment['Polia Multifuncional'].filter(ex => ex.videoId).length, 18, 'A polia deve apresentar os vídeos de cabos, puxadas e remadas.');
  assert.equal(context.__equipment['Prensa de Ombros'].filter(ex => ex.videoId).length, 2, 'A máquina Prensa de Ombros deve ter as duas variantes demonstradas.');
  for (const [equipment, exercises] of Object.entries(context.__equipment)) {
    const visible = exercises.map(ex => context.__prepareLibraryExercise({ ...ex, equipamento: equipment, equipamentos: [equipment] })).filter(Boolean);
    for (const exercise of visible) {
      assert.ok(videoItems.some(item => item.id === exercise.videoId && item.file === exercise.videoLocal), `Demonstração inválida na grelha de ${equipment}: ${exercise.nome}`);
      assert.ok(fs.existsSync(path.join(root, exercise.imagemBiblioteca.split('?')[0])), `Imagem inválida na grelha de ${equipment}: ${exercise.nome}`);
    }
  }
  const misleadingTriceps = context.__equipment['Polia Multifuncional'].find(ex => ex.nome === 'Tríceps na Polia');
  assert.ok(!misleadingTriceps.videoId, 'O clip do supino na Smith não pode ser mostrado em Tríceps na Polia.');

  for (const entry of videoItems) {
    const selected = all.find(ex => ex.videoId === entry.id);
    context.__openExercise(selected);
    for (let wait = 0; wait < 12; wait += 1) await new Promise(resolve => setImmediate(resolve));
    assert.equal(assignedVideoSources.at(-1), entry.file, `O vídeo correto deve ser atribuído a ${entry.exercise}.`);
    const video = createdVideos.at(-1);
    assert.equal(video.preload, 'metadata', `preload=metadata em ${entry.exercise}`);
    assert.equal(video.muted, true, `O som deve estar desligado em ${entry.exercise}`);
    assert.equal(video.loop, true, `Loop em ${entry.exercise}`);
    assert.equal(video.playsInline, true, `Reprodução inline em ${entry.exercise}`);
    assert.equal(video.autoplay, true, `Autoplay em ${entry.exercise}`);
    context.__closeExercise();
    assert.equal(video.paused, true, `O vídeo deve parar ao fechar: ${entry.exercise}`);
    assert.equal(video.src, '', `O src deve ser removido ao fechar: ${entry.exercise}`);
  }

  // Verifica o caminho alternativo por nome + equipamento para exercícios legados sem videoId.
  const entradaFallback = videoItems.find(x => Array.isArray(x.equipment) && x.equipment.length);
  const exerciseWithoutId = { nome: entradaFallback.exercise, equipamento: entradaFallback.equipment[0], grupo: 'Teste', passos: [] };
  context.__openExercise(exerciseWithoutId);
  for (let wait = 0; wait < 12; wait += 1) await new Promise(resolve => setImmediate(resolve));
  assert.equal(assignedVideoSources.at(-1), entradaFallback.file, 'Um exercício sem videoId deve encontrar vídeo por nome + equipamento exatos.');
  context.__closeExercise();

  // Exercício legado com nome inequívoco mas sem videoId nem equipamento.
  const entradaSemEquipamento = videoItems[0];
  const exerciseWithoutEquipment = { nome: entradaSemEquipamento.exercise, grupo: "Teste", passos: [] };
  context.__openExercise(exerciseWithoutEquipment);
  for (let wait = 0; wait < 12; wait += 1) await new Promise(resolve => setImmediate(resolve));
  assert.equal(assignedVideoSources.at(-1), entradaSemEquipamento.file, 'Um nome único deve funcionar mesmo sem equipamento no objeto.');
  context.__closeExercise();

  assert.equal(fetchCalls, 1, 'O manifesto é carregado uma única vez após o primeiro clique e reutilizado.');
  assert.equal(assignedVideoSources.length, videoItems.length + 2, 'Os vídeos são atribuídos apenas após a seleção do exercício.');

  const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  assert.match(appSource, /navigator\.serviceWorker\.register\([\s\S]*?updateViaCache:\s*["']none["']/ , 'O Service Worker deve verificar atualizações sem usar a cache do script.');
  const serviceWorkerSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(serviceWorkerSource, /vf-ginasio-v\d+/, 'A versão de cache do SW deve ter sido incrementada.');
  const styleSource = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
  assert.match(styleSource, /\.exercise-library-grid[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/, 'A biblioteca deve manter duas colunas.');
  assert.match(styleSource, /\.exercise-catalog-image img[\s\S]*?object-fit:\s*contain[\s\S]*?object-position:\s*center/, 'As imagens dos cartões devem usar contain e estar centradas.');
  assert.match(serviceWorkerSource, /url\.pathname\.endsWith\('\/assets\/exercises\/videos\/manifest\.json'\)[\s\S]*?fetch\(request, \{ cache: 'no-store' \}\)/, 'O manifesto de vídeos deve ser atualizado pela rede antes de usar cache.');
  const equipmentUiSource = fs.readFileSync(path.join(root, 'js/equipamentos.js'), 'utf8');
  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(equipmentUiSource, /Todas as dificuldades|exerciseDifficultyFilter|clearExerciseLibrarySearch/, 'O filtro de dificuldades e o controlo X devem ser removidos do código.');
  assert.match(equipmentUiSource, /id="exerciseLibrarySearch" type="text"/, 'A pesquisa deve usar input de texto para não mostrar o X nativo.');
  assert.match(equipmentUiSource, /role="listbox"[\s\S]*?ArrowDown[\s\S]*?Escape/, 'O filtro de grupos personalizado deve suportar teclado e acessibilidade.');
  assert.match(equipmentUiSource, /if \(botaoGlobal\) botaoGlobal\.hidden = false;[\s\S]*?if \(acaoGlobal\) acaoGlobal\.hidden = false;/, 'A renderização da página deve repor a visibilidade do botão global.');
  assert.match(indexSource, /id="openAllExercises"[\s\S]*?Todos os exercícios/, 'O botão de acesso à biblioteca deve usar o nome novo.');
  assert.equal((indexSource.match(/<details class="info-card"/g) || []).length, 4, 'A página Informação deve ter quatro cartões expansíveis.');
  assert.match(indexSource, /<summary class="info-card-summary">[\s\S]*?Localização/, 'O cartão de localização deve abrir através de um controlo summary acessível.');
  assert.match(indexSource, /mailto:officedigitalsolutionspt@gmail.com/, 'O email dos autores deve ser clicável.');
  assert.match(styleSource, /#page-info \.location-button[\s\S]*?background:\s*linear-gradient/, 'O botão de localização deve ter estilo visual próprio.');
  assert.match(styleSource, /#page-info \.info-card-chevron svg[\s\S]*?stroke-linecap:\s*round/, 'As setas dos cartões de informação devem ser chevrons SVG limpos.');
  assert.match(styleSource, /#page-info > \.section > h2[\s\S]*?text-align:\s*center/, 'O título da página Informação deve estar centrado.');
  assert.match(indexSource, /id="infoFeedbackForm"[\s\S]*?officedigitalsolutionspt@gmail\.com[\s\S]*?id="infoFeedbackMessage"/, 'A página Informação deve conter um formulário de feedback ligado ao email pretendido.');
  assert.match(indexSource, /id="infoFeedbackStatus"[^>]*role="status"[^>]*aria-live="polite"/, 'O formulário deve fornecer feedback acessível sobre o envio.');
  assert.match(indexSource, /<script src="js\/feedback\.js"><\/script>/, 'O controlador do formulário de feedback deve ser carregado.');
  const feedbackScript = fs.readFileSync(path.join(root, 'js/feedback.js'), 'utf8');
  assert.match(feedbackScript, /https?:|form\.action/, 'O feedback deve ser enviado através do serviço de formulário.');
  assert.match(feedbackScript, /form\.reset\(\)[\s\S]*?feedback foi submetido/, 'O formulário deve confirmar o envio e limpar o campo após sucesso.');
  assert.match(serviceWorkerSource, /'\.\/js\/feedback\.js'/, 'O controlador de feedback deve integrar o shell da PWA.');

  assert.doesNotMatch(indexSource, /<h3>Banco de Peso<\/h3>/, 'O cartão do Banco de Peso deve ser removido da página de equipamentos.');
  const trainingSource = fs.readFileSync(path.join(root, 'js/treino.js'), 'utf8');
  assert.doesNotMatch(trainingSource.match(/const EQUIPAMENTOS_GINASIO = \[([\s\S]*?)\];/)?.[1] || '', /Banco de Peso/, 'Banco de Peso não deve aparecer nas opções de equipamento dos treinos.');
  const videoManifestText = fs.readFileSync(path.join(root, 'assets/exercises/videos/manifest.json'), 'utf8');
  assert.doesNotMatch(videoManifestText, /"Banco de Peso"/, 'O manifesto de vídeos não deve atribuir exercícios ao Banco de Peso.');
  assert.match(equipmentUiSource, /new URLSearchParams\(window\.location\.search/, 'Os QR Codes devem ser resolvidos a partir do parâmetro do URL.');
  assert.match(equipmentUiSource, /abrirEquipamentoQRCodeInicial\(\)/, 'A inicialização deve abrir automaticamente o equipamento indicado no QR Code.');

  assert.match(styleSource, /\.exercise-modal-video[\s\S]*?aspect-ratio:\s*1\s*\/\s*1[\s\S]*?background:\s*#fff/, 'A janela deve usar o formato quadrado dos GIFs e fundo claro.');
  assert.match(styleSource, /#page-equipment \.equipment-global-btn,[\s\S]*?#page-equipment \.exercise-library-back[\s\S]*?width:\s*224px[\s\S]*?height:\s*42px[\s\S]*?font-size:\s*13px/, 'Os botões de navegação devem ter as mesmas dimensões e tipografia.');
  assert.match(styleSource, /\.exercise-catalog-content[\s\S]*?align-items:\s*center[\s\S]*?text-align:\s*center/, 'O conteúdo dos cartões deve estar centrado.');
  assert.match(styleSource, /\.exercise-modal-equipment[\s\S]*?justify-content:\s*center/, 'A informação do equipamento no modal deve estar centrada.');

  const equipmentRecordCount = Object.values(context.__equipment).flat().filter(ex => ex && ex.nome).length;
  console.log(JSON.stringify({
    status: 'PASS',
    globalUniqueExercises: all.length,
    equipmentRecords: equipmentRecordCount,
    localVideos: videoItems.length,
    videosWithExistingFiles: videoItems.filter(x => fs.existsSync(path.join(root, x.file))).length,
    manifestRequestsBeforeSelection: 0,
    manifestRequestsAfterAllSelections: fetchCalls,
    allVideosLazyLoadedAndReleased: true,
    uniqueCatalogNames: new Set(normalizedNames).size,
    smithMachineVideos: context.__equipment['Smith Machine'].filter(ex => ex.videoId).length,
    pulleyVideos: context.__equipment['Polia Multifuncional'].filter(ex => ex.videoId).length,
    shoulderPressMachineVideos: context.__equipment['Prensa de Ombros'].filter(ex => ex.videoId).length,
    fallbackNameAndEquipmentLookup: true,
    serviceWorkerUpdateRegistration: true,
    equipmentQrCodes: qrManifest.equipments.length,
    qrImagesExist: qrManifest.equipments.every(item => fs.existsSync(path.join(root, 'qr-codes', item.file))),
    qrUrlsUsePublishedDomain: qrManifest.equipments.every(item => item.url.startsWith(qrManifest.baseUrl))
  }, null, 2));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
