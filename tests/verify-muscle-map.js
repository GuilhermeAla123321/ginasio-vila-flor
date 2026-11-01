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
    assert.equal(mapped.length, 1, `${item.nome} deve pintar só o músculo principal`);
}

assert.deepEqual(regions('Supino Reto'), ['peito']);
assert.deepEqual(regions('Tricep JM'), ['triceps']);
assert.deepEqual(regions('Supino com barra inventado'), ['peito']);
assert.deepEqual(regions('Tríceps na Polia'), ['triceps']);
assert.deepEqual(regions('Face Pull'), ['ombros']);
// Fora do catálogo: pelo nome, depois pelo grupo; a ordem das regras evita falsos positivos.
assert.equal(regions('Crucifixo invertido')[0], 'ombros');
assert.equal(regions('Leg curl')[0], 'posteriores');
assert.equal(regions('Rosca martelo')[0], 'biceps');
assert.deepEqual(regions('Exercício inventado', 'Core'), ['abdomen', 'obliquos']);
assert.deepEqual(regions('Exercício inventado', 'Outro'), []);

// Pintar um músculo não pode pintar outro: as zonas de cada figura não se sobrepõem.
const progresso = read('js/progresso-descanso.js');
const figura = nome => {
    const inicio = progresso.indexOf(`const ${nome} = {`);
    return vm.runInNewContext(`(${progresso.slice(progresso.indexOf('{', inicio), progresso.indexOf('\n  };', inicio) + 4)})`);
};
const contorno = caminho => {
    const t = caminho.match(/[MQLZ]|-?\d+(?:\.\d+)?/g), pts = [];
    let i = 0, cur = null;
    while (i < t.length) {
        const c = t[i++];
        if (c === 'M' || c === 'L') { cur = [+t[i], +t[i + 1]]; i += 2; pts.push(cur); }
        else if (c === 'Q') {
            const a = [+t[i], +t[i + 1]], b = [+t[i + 2], +t[i + 3]]; i += 4;
            for (let k = 1; k <= 8; k++) {
                const u = k / 8;
                pts.push([0, 1].map(e => (1 - u) ** 2 * cur[e] + 2 * u * (1 - u) * a[e] + u * u * b[e]));
            }
            cur = b;
        }
    }
    return pts;
};
const dentro = ([x, y], p) => {
    let d = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) d = !d;
    }
    return d;
};
for (const [nome, vistas] of [['masculina', figura('anatomia')], ['feminina', figura('anatomiaFeminina')]]) {
    for (const [vista, { parts }] of Object.entries(vistas)) {
        const zonas = Object.entries(parts).map(([k, l]) => [k, l.map(contorno)]);
        zonas.forEach(([a, la], i) => zonas.slice(i + 1).forEach(([b, lb]) => {
            for (const pa of la) for (const pb of lb) {
                const xs = pa.map(q => q[0]), ys = pa.map(q => q[1]);
                for (let x = Math.min(...xs); x <= Math.max(...xs); x++) for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
                    assert.ok(!(dentro([x, y], pa) && dentro([x, y], pb)), `Figura ${nome}, ${vista}: ${a} toca em ${b} em ${Math.round(x)},${Math.round(y)}`);
                }
            }
        }));
    }
}

// Tudo o que o service worker pré-carrega tem de existir: um ficheiro em falta anula o cache inteiro.
const shell = [...read('sw.js').match(/APP_SHELL = \[([\s\S]*?)\]/)[1].matchAll(/'\.\/([^']+)'/g)].map(m => m[1]);
for (const file of shell) assert.ok(fs.existsSync(path.join(root, file)), `Falta no disco: ${file}`);

console.log('verify-muscle-map: OK');
