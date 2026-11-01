'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js/treino.js'), 'utf8');
const inicio = source.indexOf('function chaveSemana(');
const fim = source.indexOf('let checksSeries', inicio);
const context = {};
vm.createContext(context);
vm.runInContext(source.slice(inicio, fim) + ';this.chaveSemana = chaveSemana;', context);
const semana = (a, m, d, h = 12) => context.chaveSemana(new Date(a, m - 1, d, h));

// Segunda 2 nov 2026 a domingo 8 nov são a mesma semana; o domingo vai até às 23h59.
assert.equal(semana(2026, 11, 8, 23), semana(2026, 11, 2, 0));
assert.notEqual(semana(2026, 11, 9, 0), semana(2026, 11, 8, 23));
// Viragem de mês e de ano.
assert.equal(semana(2026, 11, 1), semana(2026, 10, 26));
assert.equal(semana(2027, 1, 1), semana(2026, 12, 28));

console.log('verify-series-checks: OK');
