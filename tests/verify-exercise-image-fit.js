const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const equipmentJs = fs.readFileSync(path.join(root, 'js/equipamentos.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

const start = equipmentJs.indexOf('const IMAGENS_EXERCICIO_BIBLIOTECA = {');
assert.notEqual(start, -1, 'O mapeamento de imagens da biblioteca deve existir.');
const end = equipmentJs.indexOf('\n};', start);
assert.notEqual(end, -1, 'O mapeamento de imagens deve estar corretamente fechado.');
const mappingBlock = equipmentJs.slice(start, end + 3);
const imageFiles = [...mappingBlock.matchAll(/"([^"]+)"\s*:\s*"([^"]+\.jpg)"/g)].map(match => match[2]);
assert.ok(imageFiles.length > 0, 'O mapeamento deve conter imagens específicas.');
assert.equal(new Set(imageFiles).size, imageFiles.length, 'Uma mesma imagem não deve ser mapeada para IDs diferentes sem necessidade.');
for (const file of imageFiles) {
  assert.ok(fs.existsSync(path.join(root, 'assets/ImagesExer', file)), `Imagem mapeada em falta: ${file}`);
}

const cardImageRule = css.slice(css.lastIndexOf('/* CORREÇÃO GLOBAL DE ENQUADRAMENTO DAS IMAGENS DOS EXERCÍCIOS'));
assert.ok(cardImageRule.includes('#exerciseLibraryResults .exercise-catalog-image'), 'A biblioteca global deve usar as regras comuns.');
assert.ok(cardImageRule.includes('.exercise-library-grid .exercise-catalog-image'), 'A grelha global deve usar as regras comuns.');
assert.ok(cardImageRule.includes('.equipment-exercise-grid .exercise-catalog-image'), 'As páginas dos equipamentos devem usar as mesmas regras.');
assert.ok(cardImageRule.includes('#filtered-exercise-list .exercise-catalog-image'), 'A grelha filtrada por equipamento deve usar as mesmas regras.');
assert.ok(/object-fit:\s*contain\s*!important/.test(cardImageRule), 'As imagens devem usar object-fit: contain.');
assert.ok(/object-position:\s*center center\s*!important/.test(cardImageRule), 'As imagens devem ficar centradas.');
assert.ok(/max-width:\s*100%\s*!important/.test(cardImageRule) && /max-height:\s*100%\s*!important/.test(cardImageRule), 'As imagens devem caber na área sem cortes.');
assert.ok(/height:\s*116px\s*!important/.test(cardImageRule), 'A área de imagem deve ter altura consistente no ecrã normal.');
assert.ok(/height:\s*112px\s*!important/.test(cardImageRule), 'A área deve adaptar-se ao ecrã móvel.');
assert.match(sw, /CACHE_NAME\s*=\s*'vf-ginasio-v71'/, 'A cache deve ser renovada para que os dispositivos descarreguem o CSS corrigido.');

console.log(`PASS: ${imageFiles.length} imagens mapeadas existem; regras de enquadramento cobrem a biblioteca geral e as páginas de equipamento.`);
