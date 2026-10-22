'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/treino.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

const start = source.indexOf('function renderLinhasSeries(');
const end = source.indexOf('\n\nfunction recolherSeries(', start);
assert.ok(start >= 0 && end > start, 'A função de renderização das séries deve existir.');
const renderer = source.slice(start, end);

assert.match(renderer, /data-series-action="delete"/, 'Cada série deve ter uma ação de remoção.');
assert.match(renderer, /aria-label="Eliminar série \$\{i \+ 1\}"/, 'O botão de lixo deve ter um nome acessível por série.');
assert.match(renderer, /count <= 1 \? "disabled"/, 'A última série deve permanecer disponível.');
assert.match(renderer, /data-series-action="add"/, 'Deve existir um botão para adicionar séries.');
assert.match(renderer, /series\.push\(\{\}\)/, 'Adicionar série deve criar uma nova série vazia.');
assert.match(renderer, /series\.splice\(index, 1\)/, 'Remover série deve retirar apenas a série selecionada.');
assert.match(renderer, /const series = lerValoresVisiveis\(\)/, 'Os valores preenchidos devem ser recolhidos antes de redesenhar as séries.');
assert.match(renderer, /Math\.min\(30, Number\(seriesCount\) \|\| 1\)/, 'A listagem deve respeitar o limite de 30 séries.');
assert.match(renderer, /renderLinhasSeries\(\s*container,\s*\{ \.\.\.exercicio, seriesData: series \},\s*series\.length/s, 'A lista deve ser novamente renderizada e renumerada após alterações.');
assert.match(css, /\.set-series-delete\s*\{/, 'O botão de apagar deve ter estilos próprios.');
assert.match(css, /\.set-series-add\s*\{/, 'O botão para adicionar série deve ter estilos próprios.');
assert.match(css, /\.set-series-delete:focus-visible[\s\S]*?\.set-series-add:focus-visible/, 'Os botões devem apresentar foco acessível.');
assert.match(sw, /CACHE_NAME\s*=\s*'vf-ginasio-v66'/, 'A cache PWA deve ser atualizada.');

console.log('PASS: remover séries, acrescentar séries, preservar valores e cache v66.');
