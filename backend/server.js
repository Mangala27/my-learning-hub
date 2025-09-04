// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const port = 3000;
const cors = require('cors'); // <- Add this



// Middleware to parse JSON bodies
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));


// Endpoint for lesson and quiz generation
app.post('/api/generate-lesson', async (req, res) => {
    const { prompt, topic, style, chapters, ageGroup } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const userPrompt = `Create a factual lesson plan on the topic of "${prompt}" for a ${ageGroup} year old. The topic is ${topic}. The explanation style should be ${style}. The lesson should be divided into ${chapters} chapters. Use simple, engaging language. Format the content as a single block of text where each sentence is on its own line for 'Beginner', 3 lines for 'Intermediate', and 5-6 sentences for 'Advanced'.
    After the lesson content, add a separator "---" and then provide a list of 3 multiple-choice questions in JSON format. For each question, provide the question text, an array of 4 options, and the correct answer. The JSON should be an array of objects.`;

    const payload = { contents: [{ role: "user", parts: [{ text: userPrompt }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Failed to generate lesson.' });
    }
});

// NEW ENDPOINT FOR TRANSLATION
app.post('/api/translate-lesson', async (req, res) => {
    const { text, targetLanguage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const userPrompt = `Translate the following text into ${targetLanguage}: ${text}`;

    const payload = { contents: [{ role: "user", parts: [{ text: userPrompt }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Server translation error:', error);
        res.status(500).json({ error: 'Failed to translate lesson.' });
    }
});

// Endpoint for text-to-speech audio generation - using a stable model
// app.post('/api/generate-audio', async (req, res) => {
//     const { text, voiceName } = req.body;
//     const apiKey = process.env.GEMINI_API_KEY;
//     const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-tts:generateContent?key=${apiKey}`;
    
//     const payload = {
//         contents: [{ parts: [{ text: text }] }],
//         generationConfig: {
//             responseModalities: ["AUDIO"],
//             speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
//         },
//         model: "gemini-1.5-flash-tts"
//     };

//     try {
//         const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });

//         if (!response.ok) {
//             const errorText = await response.text();
//             console.error(`API returned status ${response.status}: ${errorText}`);
//             res.status(response.status).json({ error: 'Failed to generate audio.', details: errorText });
//             return;
//         }

//         const audioData = await response.json();
//         res.json(audioData);

//     } catch (error) {
//         console.error('Server audio error:', error);
//         res.status(500).json({ error: 'Failed to generate audio.', details: error.message });
//     }
// });
app.post('/api/generate-audio', async (req, res) => {
    const { text, voiceName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
        },
        model: "gemini-2.5-flash-preview-tts" // Correct model name
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API returned status ${response.status}: ${errorText}`);
            res.status(response.status).json({ error: 'Failed to generate audio.', details: errorText });
            return;
        }

        const audioData = await response.json();
        res.json(audioData);

    } catch (error) {
        console.error('Server audio error:', error);
        res.status(500).json({ error: 'Failed to generate audio.', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
