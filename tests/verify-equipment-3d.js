const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const html = read('index.html');
const equipmentScript = read('js/equipamentos.js');
const viewerScript = read('js/equipment-3d.js');
const styles = read('css/style.css');
const serviceWorker = read('sw.js');

assert.match(html, /type="importmap"/, 'O import map do Three.js deve estar disponível.');
assert.match(html, /type="module" src="js\/equipment-3d\.js"/, 'O visualizador deve ser carregado como módulo.');
assert.match(equipmentScript, /modelos3DPorEquipamento/, 'Os equipamentos devem ter associação aos modelos 3D.');
assert.match(equipmentScript, /"passadeira":\s*\{\s*modelo:\s*"passadeira"\s*\}/, 'A passadeira deve ter o modelo correspondente.');
assert.match(equipmentScript, /"bicicleta":\s*\{\s*modelo:\s*"bicicleta-spinning"\s*\}/, 'A bicicleta deve ter o modelo correspondente.');
assert.match(equipmentScript, /"peck-deck":\s*\{\s*modelo:\s*"pec-fly"\s*\}/, 'O Peck Deck deve continuar a ter o seu modelo.');
assert.match(equipmentScript, /"peso-livre":\s*\{\s*modelo:\s*"suporte-halteres"/, 'O Peso Livre deve abrir o suporte de halteres.');
assert.match(equipmentScript, /Mostrar equipamento/, 'O botão deve apresentar a etiqueta pedida.');
assert.match(equipmentScript, /equipment-detail-tools/, 'O botão deve ficar junto do filtro do equipamento.');
assert.match(viewerScript, /MODEL_CATALOG/, 'O visualizador deve conter o catálogo dinâmico de modelos.');
assert.match(viewerScript, /new URL\(config\.file, import\.meta\.url\)/, 'O visualizador deve carregar o GLB selecionado.');
assert.match(viewerScript, /OrbitControls/, 'O modelo deve permitir rotação interativa.');
assert.match(viewerScript, /controls\.autoRotate = true/, 'A apresentação deve ter rotação automática suave.');
assert.match(viewerScript, /event\.key === "Escape" && isOpen/, 'A janela deve fechar com Escape.');
assert.doesNotMatch(viewerScript, /equipment-3d-hint|Arrasta para rodar/, 'A caixa de instruções por cima do modelo deve estar removida.');
assert.match(styles, /\.equipment-3d-header[\s\S]*?text-align: center;/, 'O título do cabeçalho deve estar centrado.');
assert.match(styles, /\.equipment-3d-pill[\s\S]*?align-self: center;/, 'O selo de modelo interativo deve estar centrado.');
assert.match(styles, /\.equipment-3d-details h3[^\{]*\{[^}]*text-align: center;/, 'O título do equipamento deve estar centrado.');
assert.match(styles, /\.equipment-detail-tools\s*\{[^}]*flex-wrap:\s*nowrap;/, 'O filtro e botão devem ficar lado a lado em telemóvel.');
assert.match(styles, /\.equipment-3d-model-option/, 'Os modelos alternativos de peso livre devem ter controlo visual.');
assert.match(styles, /\.equipment-3d-stage[\s\S]*?background: #fff;/, 'A área do modelo deve ter fundo branco.');
assert.match(serviceWorker, /vf-ginasio-v\d+/, 'O cache da PWA deve ter uma versão nova.');

const modelFiles = [
    'abdutor-adutor.glb', 'banco-ajustavel.glb', 'bicicleta-spinning.glb', 'eliptica.glb',
    'extensao-pernas.glb', 'haltere-hexagonal.glb', 'haltere-redondo.glb', 'leg-curl.glb',
    'leg-press.glb', 'passadeira.glb', 'pec-fly.glb', 'polia-dupla.glb', 'remo.glb',
    'shoulder-press.glb', 'smith-machine.glb', 'suporte-halteres.glb'
];
for (const filename of modelFiles) {
    const relative = `assets/models/${filename}`;
    const model = fs.readFileSync(path.join(root, relative));
    assert.equal(model.readUInt32LE(0), 0x46546c67, `${filename} deve ter o cabeçalho GLB.`);
    assert.equal(model.readUInt32LE(4), 2, `${filename} deve estar no formato glTF 2.0.`);
    assert.equal(model.readUInt32LE(8), model.length, `${filename} deve ter o tamanho declarado correto.`);
    const jsonLength = model.readUInt32LE(12);
    const gltf = JSON.parse(model.subarray(20, 20 + jsonLength).toString('utf8').replace(/[\u0000\u0020]+$/, ''));
    assert.ok(gltf.meshes?.length, `${filename} deve conter malhas 3D.`);
}

const cachedAssets = [
    'js/equipment-3d.js',
    'assets/vendor/three/build/three.module.js',
    'assets/vendor/three/examples/jsm/loaders/GLTFLoader.js',
    'assets/vendor/three/examples/jsm/controls/OrbitControls.js',
    'assets/vendor/three/examples/jsm/environments/RoomEnvironment.js',
    'assets/vendor/three/examples/jsm/utils/BufferGeometryUtils.js'
];
for (const asset of cachedAssets) {
    assert.ok(fs.existsSync(path.join(root, asset)), `Falta o recurso local: ${asset}`);
    assert.ok(serviceWorker.includes(`'./${asset}'`), `O recurso não está no cache offline da PWA: ${asset}`);
}

console.log(`Visualizador 3D: verificações de integração e integridade passaram (${modelFiles.length} modelos).`);
