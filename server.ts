import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
app.use(express.json());

const PORT = Number(process.env.API_PORT) || 3001;

function getAIConfig(apiKey: string): { baseUrl: string; model: string } | null {
  if (apiKey.startsWith('gsk_')) {
    return { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' };
  }
  if (apiKey.startsWith('xai-')) {
    return { baseUrl: 'https://api.x.ai/v1', model: 'grok-beta' };
  }
  return null;
}

// Extract JSON from AI response — handles cases where the model wraps it in markdown
function extractJSON(text: string): any {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {}

  // Try extracting from markdown code block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }

  // Try finding the first { ... } block
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }

  throw new Error('Could not extract JSON from AI response');
}

app.post('/api/ai-check', async (req, res) => {
  const { symptoms } = req.body ?? {};

  if (!symptoms?.trim()) {
    return res.status(400).json({ error: 'Please describe your symptoms.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your-groq-api-key') {
    return res.status(503).json({
      error: 'AI health guidance is temporarily unavailable. Please consult a healthcare professional or call emergency services if needed.',
      unavailable: true,
    });
  }

  const config = getAIConfig(apiKey);
  if (!config) {
    console.error('❌ Unknown API key format. Expected gsk_ (Groq) or xai- (xAI)');
    return res.status(503).json({ error: 'AI service is not configured correctly.', unavailable: true });
  }

  console.log(`🤖 Using ${config.model} at ${config.baseUrl}`);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are an AI medical triage assistant. You are NOT a doctor.
Always err on the side of caution. If symptoms suggest a heart attack, stroke, severe bleeding, or difficulty breathing, classify as Emergency.
Speak with a warm, reassuring, empathetic tone in simple everyday language.
You MUST respond with ONLY a raw JSON object — no markdown, no explanation, just the JSON:
{
  "severity": "Low" or "Moderate" or "Emergency",
  "summary": "A warm empathetic 2-3 sentence paragraph in simple terms",
  "causes": ["possible cause 1", "possible cause 2", "possible cause 3"],
  "advice": ["step 1", "step 2", "step 3", "step 4"]
}`,
          },
          {
            role: 'user',
            content: `Symptoms: ${symptoms}`,
          },
        ],
      }),
    });

    const rawText = await response.text();
    console.log(`📡 API status: ${response.status}`);
    console.log(`📡 API response: ${rawText.slice(0, 500)}`);

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(503).json({
          error: 'AI service is temporarily busy. Please wait a moment and try again.',
          unavailable: true,
        });
      }
      if (response.status === 401) {
        return res.status(503).json({
          error: 'AI service authentication failed. Please check your API key.',
          unavailable: true,
        });
      }
      throw new Error(`API returned ${response.status}: ${rawText.slice(0, 200)}`);
    }

    const data = JSON.parse(rawText);
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from AI');

    const parsed = extractJSON(content);

    if (!parsed.severity || !parsed.summary || !parsed.causes || !parsed.advice) {
      throw new Error(`Missing fields in AI response: ${JSON.stringify(parsed)}`);
    }

    // Normalise severity in case the model returns something unexpected
    const severityMap: Record<string, string> = {
      low: 'Low', moderate: 'Moderate', emergency: 'Emergency',
      high: 'Emergency', medium: 'Moderate', mild: 'Low',
    };
    parsed.severity = severityMap[parsed.severity.toLowerCase()] ?? parsed.severity;

    return res.json(parsed);
  } catch (err: any) {
    console.error('❌ AI check failed:', err?.message || err);
    return res.status(500).json({ error: 'Failed to analyze symptoms. Please try again.' });
  }
});

app.get('/api/health', (_req, res) => {
  const key = process.env.GROQ_API_KEY ?? '';
  const config = getAIConfig(key);
  res.json({ ok: true, ai: !!config, provider: config?.model ?? 'none' });
});

app.listen(PORT, () => {
  console.log(`✅ CareBridge API running on http://localhost:${PORT}`);
  const key = process.env.GROQ_API_KEY ?? '';
  const config = getAIConfig(key);
  if (!config) {
    console.warn('⚠️  No valid AI key. Set GROQ_API_KEY in .env.local');
    console.warn('   Groq (free): https://console.groq.com  → key starts with gsk_');
    console.warn('   xAI  (free credits): https://console.x.ai → key starts with xai-');
  } else {
    console.log(`✅ AI ready — ${config.model}`);
  }
});
