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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    outputEl.textContent = data.output;
    statusEl.textContent = 'Done';
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
  }
});
