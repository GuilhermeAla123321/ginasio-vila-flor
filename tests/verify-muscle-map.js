'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// Só os dois catálogos: o resto de equipamentos.js precisa do DOM.
const equipamentos = read('js/equipamentos.js');
const extract = name => {
    const start = equipamentos.indexOf(`const ${name} = {`);
    return equipamentos.slice(start, equipamentos.indexOf('\n};', start) + 3);
};
const stub = { addEventListener() {}, getElementById: () => null, querySelectorAll: () => [], readyState: 'loading' };
const context = { Image: class {}, document: stub, localStorage: { getItem: () => null, setItem() {} }, setTimeout, clearTimeout, setInterval, clearInterval };
context.window = context;
vm.createContext(context);
vm.runInContext(`${extract('EQUIPAMENTOS_EXERCICIOS')};${extract('EXERCICIOS_EXTRA')};this.catalogo=[...Object.values(EQUIPAMENTOS_EXERCICIOS),...Object.values(EXERCICIOS_EXTRA)].flat();`, context);
vm.runInContext(read('js/progresso-descanso.js'), context);

const regions = (nome, grupo) => [...context.regioesDoExercicio({ nome, grupo })];

// Todos os músculos do catálogo têm de chegar a uma zona do mapa.
for (const item of context.catalogo) {
    if (!item.musculos) continue;
    const mapped = regions(item.nome);
    assert.ok(mapped.length, `${item.nome} não acende nenhum músculo`);
}

assert.deepEqual(regions('Supino Reto'), ['peito', 'triceps', 'ombros']);
assert.deepEqual(regions('Tríceps na Polia'), ['triceps']);
assert.deepEqual(regions('Face Pull'), ['ombros', 'trapezio', 'costas']);
// Fora do catálogo: pelo nome, depois pelo grupo; a ordem das regras evita falsos positivos.
assert.equal(regions('Crucifixo invertido')[0], 'ombros');
assert.equal(regions('Leg curl')[0], 'posteriores');
assert.equal(regions('Rosca martelo')[0], 'biceps');
assert.deepEqual(regions('Exercício inventado', 'Core'), ['abdomen', 'obliquos']);
assert.deepEqual(regions('Exercício inventado', 'Outro'), []);

// Tudo o que o service worker pré-carrega tem de existir: um ficheiro em falta anula o cache inteiro.
const shell = [...read('sw.js').match(/APP_SHELL = \[([\s\S]*?)\]/)[1].matchAll(/'\.\/([^']+)'/g)].map(m => m[1]);
for (const file of shell) assert.ok(fs.existsSync(path.join(root, file)), `Falta no disco: ${file}`);

console.log('verify-muscle-map: OK');
