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

const callExternalLLM = async (prompt) => {
  const { apiKey, apiUrl, model } = getProviderConfig();
  if (!apiKey || !apiUrl || !model) {
    throw new Error('AI provider configuration is missing. Set ai.key, ai.url, and ai.model.');
  }

  const payload = {
    model,
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

  const data = await response.json();
  return data.choices?.[0]?.message?.content || data.result || JSON.stringify(data);
};

app.post(['/generate', '/api/generate'], async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt in request body.' });
    }

    const aiResponse = await callExternalLLM(prompt);
    return res.json({ output: aiResponse });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

exports.api = functions.region('us-central1').https.onRequest(app);
