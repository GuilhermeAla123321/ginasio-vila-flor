const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/feedback.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

assert.match(html, /id="infoFeedbackForm"[^>]*action="https:\/\/formsubmit\.co\/ajax\/officedigitalsolutionspt@gmail\.com"/, 'O formulário deve usar o endpoint de envio para o email de destino.');
assert.match(html, /id="infoFeedbackMessage"[^>]*name="feedback"[^>]*required/, 'A caixa de feedback deve ser obrigatória e ter um nome de campo.');
assert.equal((html.match(/class="info-card-chevron"/g) || []).length, 4, 'Os quatro cartões devem manter uma seta por cartão.');
assert.doesNotMatch(html, /info-card-chevron[^>]*>\s*⌄/, 'As setas antigas em formato de letra devem desaparecer.');
assert.match(css, /#page-info \.info-card-chevron svg[\s\S]*?stroke-linejoin:\s*round/, 'As setas devem usar um ícone SVG estilizado.');
assert.match(css, /#page-info > \.section > h2[\s\S]*?text-align:\s*center/, 'O título Informação deve permanecer centrado.');
assert.match(sw, /vf-ginasio-v66/, 'A cache PWA deve ser incrementada.');
assert.match(sw, /'\.\/js\/feedback\.js'/, 'O JS do formulário deve estar na cache da PWA.');
assert.match(html, /OFFICE DIGITAL SOLUTIONS/, 'O cartão Sobre a aplicação deve mostrar a marca Office Digital Solutions.');
assert.match(html, /SOFTWARE <span aria-hidden="true">·<\/span> WEB <span aria-hidden="true">·<\/span> INOVAÇÃO/, 'A assinatura deve identificar as áreas de atuação.');
assert.match(html, /Guilherme Ala <span aria-hidden="true">&amp;<\/span> Daniel Moutinho/, 'Os dois autores devem aparecer no crédito do projeto.');
assert.match(html, /Ginásio Municipal de Vila Flor/, 'O crédito deve identificar o projeto do ginásio.');
assert.match(html, /class="ods-brand-email" href="mailto:officedigitalsolutionspt@gmail.com"/, 'O email da marca deve ser clicável.');


function makeClassList() {
  const values = new Set();
  return { toggle(name, enabled) { enabled ? values.add(name) : values.delete(name); }, contains(name) { return values.has(name); } };
}
const events = {};
const messageField = {
  value: 'Sugestão para melhorar a aplicação',
  setCustomValidity(value) { this.customValidity = value; },
  reportValidity() { return true; }
};
const honey = { value: '' };
const submitLabel = { textContent: 'Enviar feedback' };
const submitButton = {
  disabled: false,
  querySelector(selector) { return selector === 'span' ? submitLabel : null; }
};
const status = { hidden: true, textContent: '', classList: makeClassList() };
const form = {
  action: 'https://formsubmit.co/ajax/officedigitalsolutionspt@gmail.com',
  elements: { namedItem(name) { return name === '_honey' ? honey : null; } },
  addEventListener(name, cb) { events[name] = cb; },
  reportValidity() { return true; },
  reset() { this.didReset = true; messageField.value = ''; }
};
const elements = {
  infoFeedbackForm: form,
  infoFeedbackMessage: messageField,
  infoFeedbackSubmit: submitButton,
  infoFeedbackStatus: status
};
let request;
const context = {
  document: { getElementById(id) { return elements[id] || null; } },
  FormData: class {
    constructor(theForm) { this.theForm = theForm; }
    entries() { return [['feedback', messageField.value], ['_subject', 'Feedback — Ginásio Municipal'], ['_template', 'table'], ['_honey', honey.value]]; }
  },
  fetch: async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ success: 'true', message: 'Sent' }) };
  },
  console
};
vm.runInNewContext(source, context, { filename: 'feedback.js' });

(async () => {
  let prevented = false;
  await events.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true, 'O formulário deve enviar via AJAX sem navegar para outra página.');
  assert.equal(request.url, 'https://formsubmit.co/ajax/officedigitalsolutionspt@gmail.com', 'O envio deve apontar para o email definido.');
  assert.equal(request.options.method, 'POST', 'O feedback deve ser submetido via POST.');
  assert.equal(request.options.headers.Accept, 'application/json', 'O endpoint deve ser pedido em modo JSON.');
  assert.equal(form.didReset, true, 'O campo deve ser limpo após um envio bem-sucedido.');
  assert.equal(status.textContent, 'Obrigado! O teu feedback foi submetido.', 'O utilizador deve receber confirmação clara.');
  assert.equal(status.hidden, false, 'A confirmação deve estar visível.');
  assert.equal(submitButton.disabled, false, 'O botão deve voltar a ficar ativo após terminar.');
  assert.equal(submitLabel.textContent, 'Enviar feedback', 'O rótulo do botão deve ser restaurado.');
  console.log('PASS: setas SVG, título centrado, formulário de feedback, endpoint e confirmação de envio.');
})().catch(error => { console.error(error); process.exitCode = 1; });
