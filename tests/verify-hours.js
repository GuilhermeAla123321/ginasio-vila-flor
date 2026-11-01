'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js/horario.js'), 'utf8');
const inicio = source.indexOf('function minutos(');
const fim = source.indexOf('function atualizarEstadoHorario(');
const context = {};
vm.createContext(context);
vm.runInContext(source.slice(inicio, fim) + ';this.minutosAteAbrir = minutosAteAbrir; this.formatarEspera = formatarEspera; this.eFeriadoNacional = eFeriadoNacional;', context);

// Segunda a sexta com duas sessões; sábado de manhã; domingo fechado.
const semana = {
  0: [],
  1: [{ inicio: '08:00' }, { inicio: '15:00' }], 2: [{ inicio: '08:00' }, { inicio: '15:00' }],
  3: [{ inicio: '08:00' }, { inicio: '15:00' }], 4: [{ inicio: '08:00' }, { inicio: '15:00' }],
  5: [{ inicio: '08:00' }, { inicio: '15:00' }], 6: [{ inicio: '09:00' }]
};
const espera = (h, m, dia) => context.minutosAteAbrir(h * 60 + m, dia, d => semana[d]);

assert.equal(espera(7, 30, 1), 30, 'Antes da abertura de hoje');
assert.equal(espera(13, 0, 1), 120, 'Entre as duas sessões');
assert.equal(espera(20, 0, 1), 720, 'Depois do fecho, abre amanhã');
assert.equal(espera(20, 0, 6), 36 * 60 + 0, 'Sábado à noite salta o domingo');
assert.equal(espera(10, 0, 0), 22 * 60, 'Domingo abre na segunda');
assert.equal(context.minutosAteAbrir(600, 1, () => []), null, 'Sem horários não há previsão');

assert.equal(context.formatarEspera(25), '25 min');
assert.equal(context.formatarEspera(120), '2 h');
assert.equal(context.formatarEspera(135), '2 h 15 min');
assert.equal(context.formatarEspera(1440), '1 dia');
assert.equal(context.formatarEspera(1440 + 180), '1 dia e 3 h');
assert.equal(context.formatarEspera(2880 + 30), '2 dias');

console.log('verify-hours: OK');

// Feriados fixos e móveis (Páscoa 2026: 5 de abril; 2027: 28 de março).
for (const [ano, mes, dia, esperado] of [
  [2026, 12, 25, true], [2026, 4, 3, true], [2026, 6, 4, true], [2027, 3, 26, true], [2027, 5, 27, true],
  [2026, 11, 2, false], [2026, 4, 5, false], [2026, 6, 5, false]
]) {
  assert.equal(context.eFeriadoNacional(new Date(ano, mes - 1, dia)), esperado, `${dia}/${mes}/${ano}`);
}
