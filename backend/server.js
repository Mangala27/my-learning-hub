// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// On Netlify (Node 18+), fetch is global. If you prefer node-fetch, uncomment next line:
// const fetch = require('node-fetch');

const app = express();

// --- Middleware ---
app.use(cors({
  origin: [
    'https://learncuddleliko.netlify.app', // replace with your actual Netlify site URL
    // 'https://test1.test.com'           // replace/add any custom domains you use
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); 

// NOTE: Do NOT serve static files here for Netlify Functions.
// Netlify will serve /public directly as your site.
// If you need static locally, you can enable this block when not running on Netlify:
// const path = require('path');
// if (process.env.NETLIFY !== 'true') {
//   app.use(express.static(path.join(__dirname, '..', 'public')));
// }

// --- Routes ---

// Generate lesson
app.post('/api/generate-lesson', async (req, res) => {
  const { prompt, topic, style, chapters, ageGroup } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const userPrompt =
    `Create a factual lesson plan on the topic of "${prompt}" for a ${ageGroup} year old. The topic is ${topic}. ` +
    `The explanation style should be ${style}. The lesson should be divided into ${chapters} chapters. ` +
    `Use simple, engaging language. Format the content as a single block of text where each sentence is on its own line for 'Beginner', ` +
    `3 lines for 'Intermediate', and 5-6 sentences for 'Advanced'. ` +
    `After the lesson content, add a separator "---" and then provide a list of 3 multiple-choice questions in JSON format. ` +
    `For each question, provide the question text, an array of 4 options, and the correct answer. The JSON should be an array of objects.`;

  const payload = { contents: [{ role: 'user', parts: [{ text: userPrompt }] }] };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('generate-lesson error:', err);
    return res.status(500).json({ error: 'Failed to generate lesson.' });
  }
});

// Translate lesson
app.post('/api/translate-lesson', async (req, res) => {
  const { text, targetLanguage } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const userPrompt = `Translate the following text into ${targetLanguage}: ${text}`;
  const payload = { contents: [{ role: 'user', parts: [{ text: userPrompt }] }] };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('translate-lesson error:', err);
    return res.status(500).json({ error: 'Failed to translate lesson.' });
  }
});

// Text-to-speech
app.post('/api/generate-audio', async (req, res) => {
  const { text, voiceName } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }

  // Using the preview TTS model you specified
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
    },
    model: 'gemini-2.5-flash-preview-tts'
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TTS API ${response.status}: ${errorText}`);
      return res.status(response.status).json({ error: 'Failed to generate audio.', details: errorText });
    }

    const audioData = await response.json();
    return res.json(audioData);
  } catch (err) {
    console.error('generate-audio error:', err);
    return res.status(500).json({ error: 'Failed to generate audio.', details: err.message });
  }
});

// Export the Express app (required for Netlify Functions wrapper)
module.exports = app;

// Local-only server (ignored on Netlify). Run: `node backend/server.js`
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Local server running at http://localhost:${port}`));
}
