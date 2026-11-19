import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const GAS_BASE_URL = 'https://script.google.com/macros/s/AKfycbxLZh3AEON1wweJc3jBWjjWOTPltAmGIgVqRtFCqX9kmzz7JEeMoilTMG8u9X3RiU8_/exec';

// Initialize Gemini client if API key is present
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Proxy GET endpoint for Google Apps Script (Rule 1: ALL data reads including Login use GET with ?tabName=...)
app.get('/api/gas', async (req, res) => {
  let targetUrl = '';
  try {
    const tabName = (req.query.tabName as string) || '';
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        params.set(key, value);
      }
    }
    if (!params.has('tabName') && tabName) {
      params.set('tabName', tabName);
    }
    const queryString = params.toString();
    targetUrl = `${GAS_BASE_URL}${queryString ? '?' + queryString : ''}`;
    console.log('GET exact URL called to GAS:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: 'success', raw: text };
    }

    res.json({ ...data, _urlCalled: targetUrl });
  } catch (error: any) {
    console.error('GAS GET Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
      _urlCalled: targetUrl || GAS_BASE_URL,
    });
  }
});

// Proxy POST endpoint for Google Apps Script (Rule 2: UPSERT / DELETE appends ?tabName=... and includes tabName in JSON body)
app.post('/api/gas', async (req, res) => {
  let targetUrl = '';
  try {
    const payload = req.body || {};
    const tabName = payload.tabName || req.query.tabName || '';
    
    const params = new URLSearchParams();
    if (tabName) {
      params.set('tabName', tabName);
    }
    if (payload.action) {
      params.set('action', payload.action);
    }

    const queryString = params.toString();
    targetUrl = `${GAS_BASE_URL}${queryString ? '?' + queryString : ''}`;
    console.log('POST exact URL called to GAS:', targetUrl, 'Payload:', payload);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: 'success', raw: text };
    }

    res.json({ ...data, _urlCalled: targetUrl });
  } catch (error: any) {
    console.error('GAS POST Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
      _urlCalled: targetUrl || `${GAS_BASE_URL}?tabName=${encodeURIComponent(req.body?.tabName || '')}`,
    });
  }
});

// AI WhatsApp Parser endpoint
app.post('/api/parse-wa', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const prompt = `You are an expert real estate AI assistant for "The Leasing Company" (TLC).
Analyze the following broker WhatsApp message(s).
The message might contain one or multiple properties (commercial/residential), client requirements, or follow-up notes.
Clean up shorthand notations (e.g., UF = Unfurnished, SF = Semi-Furnished, FF = Fully-Furnished, K = Thousand, Lac = 100,000, Cr = 10,000,000, Carpet/Built-up area).

Classify each extracted item into one of these categories:
- "Commercial Inventory"
- "Residential Inventory"
- "CRM Requirement"
- "Follow-Up"

Return a JSON array of items following this schema:
[
  {
    "category": "Commercial Inventory" | "Residential Inventory" | "CRM Requirement" | "Follow-Up",
    "title": "Short descriptive title",
    "location": "Locality / Area",
    "propertyType": "Office Space / Retail / Apartment / Villa etc.",
    "bhkOrConfig": "e.g., 3 BHK or 2500 sq.ft",
    "furnishing": "Fully-Furnished / Semi-Furnished / Unfurnished",
    "budgetOrPrice": "e.g., ₹1.5 Lacs/mo or ₹2.5 Cr",
    "contactPerson": "Broker or client name if mentioned",
    "phone": "Phone number if mentioned",
    "notes": "Detailed cleaned notes and broker comments"
  }
]

WhatsApp Message to parse:
"""
${message}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              location: { type: Type.STRING },
              propertyType: { type: Type.STRING },
              bhkOrConfig: { type: Type.STRING },
              furnishing: { type: Type.STRING },
              budgetOrPrice: { type: Type.STRING },
              contactPerson: { type: Type.STRING },
              phone: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || '[]');
    res.json({ success: true, items: parsedData });
  } catch (error: any) {
    console.error('WA Parser Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
