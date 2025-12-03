import express from 'express';
import path from 'path';
import { researchTopicForPrompt, generateInfographicImage, editInfographicImage } from './geminiService.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '50mb' }));

// API Routes
app.post('/api/research', async (req, res) => {
  try {
    const { topic, complexityLevel, visualStyle, language } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await researchTopicForPrompt(topic, complexityLevel, visualStyle, language);
    res.json(result);
  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Research failed' });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const imageData = await generateInfographicImage(prompt);
    res.json({ imageData });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Image generation failed' });
  }
});

app.post('/api/edit-image', async (req, res) => {
  try {
    const { imageBase64, editInstruction } = req.body;

    if (!imageBase64 || !editInstruction) {
      return res.status(400).json({ error: 'Image and edit instruction are required' });
    }

    const imageData = await editInfographicImage(imageBase64, editInstruction);
    res.json({ imageData });
  } catch (error) {
    console.error('Edit image error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Image editing failed' });
  }
});

// Serve static files from dist folder in production
app.use(express.static(path.join(process.cwd(), 'dist')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
