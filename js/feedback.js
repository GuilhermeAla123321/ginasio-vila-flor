/* Envio de feedback da página Informação. Usa FormSubmit como serviço de formulário para o site estático. */
(() => {
  const form = document.getElementById('infoFeedbackForm');
  const messageField = document.getElementById('infoFeedbackMessage');
  const submitButton = document.getElementById('infoFeedbackSubmit');
  const status = document.getElementById('infoFeedbackStatus');
  if (!form || !messageField || !submitButton || !status) return;

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.hidden = false;
    status.classList.toggle('error', isError);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const feedback = messageField.value.trim();
    if (feedback.length < 5) {
      messageField.setCustomValidity('Escreve pelo menos 5 caracteres para o feedback.');
      messageField.reportValidity();
      messageField.setCustomValidity('');
      return;
    }

    const honey = form.elements.namedItem('_honey');
    if (honey && honey.value) return;

    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = 'A enviar…';
    setStatus('A enviar o teu feedback…');

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.feedback = feedback;
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let result = {};
      try { result = await response.json(); } catch (_) { /* resposta não JSON */ }
      const succeeded = response.ok && (
        result.success === true ||
        result.success === 'true' ||
        result.success === 1
      );

      if (!succeeded) {
        const detail = typeof result.message === 'string' && result.message.trim()
          ? ` (${result.message.trim()})`
          : '';
        setStatus(`Não foi possível enviar o feedback. Tenta novamente dentro de momentos${detail}.`, true);
        return;
      }

      form.reset();
      setStatus('Obrigado! O teu feedback foi submetido.');
    } catch (error) {
      setStatus('Não foi possível ligar ao serviço de envio. Verifica a ligação à Internet e tenta novamente.', true);
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector('span').textContent = 'Enviar feedback';
    }
  });
})();
