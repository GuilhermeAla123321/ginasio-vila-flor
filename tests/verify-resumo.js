'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js/resumo.js'), 'utf8');
const inicio = source.indexOf("const DIAS");
const fim = source.indexOf('// --- story ---');
const context = {};
vm.createContext(context);
vm.runInContext(source.slice(inicio, fim) + ';this.calcularResumo = calcularResumo;this.conselhos = conselhos;this.registarSemana = registarSemana;this.semanaAnterior = semanaAnterior;this.intervaloSemana = intervaloSemana;this.semanaVisivel = semanaVisivel;this.proximoDomingo = proximoDomingo;this.inicioSemana = inicioSemana;', context);

const nomes = { peito: 'Peito', costas: 'Costas', quadriceps: 'Quadríceps', gemeos: 'Gémeos' };
const regioes = ex => ({ Supino: ['peito'], Remada: ['costas'], 'Leg Press': ['quadriceps'] })[ex.nome] || [];
const s = (c, r) => ({ carga: String(c), repeticoes: String(r) });
// Domingo 8 nov 2026; a semana começa na segunda 2 nov.
const agora = new Date(2026, 10, 8, 18).getTime();
const antes = new Date(2026, 9, 20).getTime(), estaSemana = new Date(2026, 10, 4).getTime();
const treinos = {
  segunda: [{ id: 't1', nome: 'Peito', exercicios: [
    { id: 1, nome: 'Supino', seriesData: [s(50, 10), s(50, 8)], historico: [{ id: antes, seriesData: [s(40, 10)] }, { id: estaSemana, seriesData: [s(50, 10)] }] },
    { id: 2, nome: 'Remada', seriesData: [{ pesoHalter: '14', repeticoes: '10' }], historico: [{ id: antes, seriesData: [{ pesoHalter: '14', repeticoes: '10' }] }] }
  ] }],
  quinta: [{ id: 't2', nome: 'Pernas', exercicios: [{ id: 3, nome: 'Leg Press', seriesData: [s('90,5', 12)], historico: [] }] }],
  sabado: [{ id: 't3', nome: 'Vazio', exercicios: [] }]
};
const marcados = { 't1|1|0': true, 't1|1|1': true, 'velho|9|0': true };
const r = context.calcularResumo(treinos, marcados, regioes, nomes, agora);

assert.deepEqual([...r.dias], ['segunda', 'quinta']);
assert.equal(r.treinos, 2);
assert.equal(r.exercicios, 3);
assert.equal(r.series, 4);
assert.equal(r.feitas, 2, 'checks de exercícios que já não existem não contam');
// 500 + 400 + 28*10 (dois halteres) + 90,5*12 = 2266
assert.equal(r.volume, 2266);
assert.deepEqual([...r.podio.map(p => p.nome)], ['Leg Press', 'Supino', 'Remada']);
assert.equal(r.evolucao.nome, 'Supino');
assert.equal(r.evolucao.pct, 25);
assert.equal(r.momentos.length, 1, 'só as subidas desta semana são momentos');
assert.equal(r.momentos[0].para, 50);
assert.deepEqual([...r.emFalta], ['gemeos']);
assert.ok(context.conselhos(r, nomes).length <= 4);

const vazio = context.calcularResumo({}, {}, regioes, nomes, agora);
assert.equal(vazio.exercicios, 0);
assert.equal(vazio.evolucao, null);
assert.ok(context.conselhos(vazio, nomes).length > 0);

// Semanas guardadas: a anterior encontra-se a partir de qualquer dia da semana atual, só ficam 8.
const segunda = d => new Date(2026, 10, d, 10).getTime();
let guardadas = context.registarSemana({}, { ...r, feitas: 9 }, segunda(1)); // domingo 1 nov: semana de 26 out
guardadas = context.registarSemana(guardadas, r, agora);
assert.equal(context.semanaAnterior(guardadas, agora).feitas, 9);
assert.equal(context.semanaAnterior(guardadas, segunda(2)).feitas, 9);
assert.equal(context.semanaAnterior(guardadas, segunda(9)).feitas, 2, 'na semana seguinte, a anterior é a de 2 a 8');
for (let i = 1; i <= 12; i++) guardadas = context.registarSemana(guardadas, r, agora + i * 7 * 864e5);
assert.equal(Object.keys(guardadas).length, 8);
assert.equal(context.intervaloSemana(agora), '2 a 8 de novembro');
assert.equal(context.intervaloSemana(new Date(2026, 10, 1).getTime()), '26 de outubro a 1 de novembro');

// Rewind: ao domingo vê-se a semana atual; de segunda a sábado, a semana que acabou no domingo.
const semanaDe = (a, m, d) => context.inicioSemana(new Date(a, m - 1, d, 12).getTime());
assert.equal(context.semanaVisivel(agora), semanaDe(2026, 11, 2), 'domingo 8: semana de 2 a 8');
assert.equal(context.semanaVisivel(segunda(9)), semanaDe(2026, 11, 2), 'segunda 9: ainda a semana de 2 a 8');
assert.equal(context.semanaVisivel(new Date(2026, 10, 14, 23).getTime()), semanaDe(2026, 11, 2), 'sábado 14: ainda a semana de 2 a 8');
assert.equal(context.semanaVisivel(new Date(2026, 10, 15, 0, 5).getTime()), semanaDe(2026, 11, 9), 'domingo 15: semana de 9 a 15');
assert.equal(context.proximoDomingo(new Date(2026, 10, 7).getTime()), 8);
assert.equal(context.proximoDomingo(agora), 15);
assert.equal(context.proximoDomingo(new Date(2026, 10, 30).getTime()), 6, 'vira o mês');

// Conselhos: iguais durante a semana, diferentes na seguinte; os do plano vêm primeiro.
const equilibrado = { ...r, pernas: 9, empurrar: 9, puxar: 9, emFalta: [], evolucao: { pct: 5 }, dias: ['a', 'b', 'c'], feitas: 4, series: 4 };
const titulos = semana => context.conselhos(equilibrado, nomes, semana).map(c => c[0]).join('|');
assert.equal(titulos(semanaDe(2026, 11, 2)), titulos(semanaDe(2026, 11, 2) + 3 * 864e5));
assert.notEqual(titulos(semanaDe(2026, 11, 2)), titulos(semanaDe(2026, 11, 9)));
assert.notEqual(titulos(semanaDe(2026, 11, 9)), titulos(semanaDe(2026, 11, 16)));
assert.equal(context.conselhos({ ...equilibrado, pernas: 0 }, nomes, semanaDe(2026, 11, 2)).length, 3);
assert.ok(/pernas/i.test(context.conselhos({ ...equilibrado, pernas: 0 }, nomes, semanaDe(2026, 11, 9))[0].join(' ')));

console.log('verify-resumo: OK');
