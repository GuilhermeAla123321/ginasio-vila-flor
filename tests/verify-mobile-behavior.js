const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

assert.match(css, /html\s*\{[^}]*touch-action:\s*manipulation/s,
  'O zoom acidental por duplo toque deve ser desativado sem bloquear zoom com pinça.');
assert.match(app, /orientation\.lock\("portrait"\)/,
  'A aplicação deve tentar bloquear a orientação vertical em navegadores compatíveis.');
assert.match(app, /addEventListener\("pointerdown",\s*solicitarOrientacaoVertical/,
  'A aplicação deve repetir o pedido de bloqueio após interação do utilizador.');
assert.equal(manifest.orientation, 'portrait', 'O manifesto PWA deve indicar orientação portrait.');
assert.match(html, /class="portrait-lock-screen"[\s\S]*?Utiliza a aplicação na vertical/,
  'Deve existir uma mensagem acessível de fallback para ecrãs móveis em paisagem.');
assert.match(css, /@media\s*\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*600px\)\s*and\s*\(pointer:\s*coarse\)/,
  'O fallback deve aplicar-se a dispositivos táteis baixos em orientação paisagem.');
assert.match(sw, /vf-ginasio-v63/, 'A cache deve mudar para atualizar os ficheiros nos dispositivos.');
console.log('PASS: duplo toque, bloqueio portrait, fallback em paisagem e cache PWA.');
