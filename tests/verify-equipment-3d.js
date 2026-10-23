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
assert.match(equipmentScript, /slugEquipamento === "peck-deck"/, 'Só o Peck Deck deve disponibilizar este modelo.');
assert.match(equipmentScript, /Mostrar equipamento/, 'O botão deve apresentar a etiqueta pedida.');
assert.match(equipmentScript, /equipment-detail-tools/, 'O botão deve ficar junto do filtro do equipamento.');
assert.match(viewerScript, /OrbitControls/, 'O modelo deve permitir rotação interativa.');
assert.match(viewerScript, /controls\.autoRotate = true/, 'A apresentação deve ter rotação automática suave.');
assert.match(viewerScript, /event\.key === "Escape" && isOpen/, 'A janela deve fechar com Escape.');
assert.doesNotMatch(viewerScript, /equipment-3d-hint|Arrasta para rodar/, 'A caixa de instruções por cima do modelo deve estar removida.');
assert.match(styles, /\.equipment-3d-header[\s\S]*?text-align: center;/, 'O título do cabeçalho deve estar centrado.');
assert.match(styles, /\.equipment-3d-pill[\s\S]*?align-self: center;/, 'O selo de modelo interativo deve estar centrado.');
assert.match(styles, /\.equipment-3d-details h3[^{]*\{[^}]*text-align: center;/, 'O título Peck Deck da descrição deve estar centrado.');
assert.match(styles, /\.equipment-3d-stage[\s\S]*?background: #fff;/, 'A área do modelo deve ter fundo branco.');
assert.match(serviceWorker, /vf-ginasio-v70/, 'O cache da PWA deve ter uma versão nova.');

const model = fs.readFileSync(path.join(root, 'assets/models/pec-fly.glb'));
const magic = model.readUInt32LE(0);
const version = model.readUInt32LE(4);
const declaredLength = model.readUInt32LE(8);
const jsonLength = model.readUInt32LE(12);
const gltf = JSON.parse(model.subarray(20, 20 + jsonLength).toString('utf8').replace(/[\u0000\u0020]+$/, ''));

assert.equal(magic, 0x46546c67, 'O modelo deve ter o cabeçalho GLB.');
assert.equal(version, 2, 'O modelo deve estar no formato glTF 2.0.');
assert.equal(declaredLength, model.length, 'O tamanho declarado do GLB deve corresponder ao ficheiro.');
assert.ok(gltf.meshes?.length, 'O GLB deve conter malhas 3D.');
assert.ok(gltf.animations?.some(animation => animation.name === 'Pec_Fly'), 'O GLB deve conter a animação de peitoral.');

const cachedAssets = [
    'js/equipment-3d.js',
    'assets/models/pec-fly.glb',
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

console.log('Visualizador 3D: verificações de integração e integridade passaram.');
