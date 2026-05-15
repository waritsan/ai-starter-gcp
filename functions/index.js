require('dotenv').config();

const functions = require('firebase-functions');
const express = require('express');
const app = express();
app.use(express.json());

const getProviderConfig = () => {
  return {
    apiKey: process.env.LLM_API_KEY,
    apiUrl: process.env.LLM_API_URL,
    model: process.env.LLM_MODEL
  };
};

const callExternalLLMStream = async (prompt, res) => {
  const { apiKey, apiUrl, model } = getProviderConfig();
  if (!apiKey || !apiUrl || !model) {
    throw new Error('AI provider configuration is missing. Set LLM_API_KEY, LLM_API_URL, and LLM_MODEL.');
  }

  const payload = {
    model,
    stream: true,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ]
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM provider error: ${response.status} ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      const payloadText = trimmed.slice('data: '.length);
      try {
        const parsed = JSON.parse(payloadText);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          res.write(delta);
        }
      } catch (err) {
        // Ignore malformed stream lines.
      }
    }
  }
};

app.post(['/generate', '/api/generate'], async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt in request body.' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    await callExternalLLMStream(prompt, res);
    res.end();
    return null;
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
    res.write(`\n\nError: ${error.message || 'Internal server error'}`);
    res.end();
    return null;
  }
});

const api = functions.region('us-central1').https.onRequest(app);

module.exports = { app, api };
