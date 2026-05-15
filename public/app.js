const submitButton = document.getElementById('submit');
const promptEl = document.getElementById('prompt');
const outputEl = document.getElementById('output');
const statusEl = document.getElementById('status');

submitButton.addEventListener('click', async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) {
    statusEl.textContent = 'Please enter a prompt.';
    return;
  }

  statusEl.textContent = 'Generating...';
  outputEl.textContent = '';

  try {
    const response = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Request failed');
    }

    statusEl.textContent = 'Streaming response...';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partial = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      partial += decoder.decode(value, { stream: true });
      outputEl.textContent = partial;
    }

    statusEl.textContent = 'Done';
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
  }
});
