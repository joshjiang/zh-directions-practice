/**
 * Local development server.
 *
 * In production the same logic runs as Vercel functions (api/grade.js,
 * api/health.js); this file exists so `npm run dev:all` works without needing
 * the Vercel CLI. Keep it thin - the logic belongs in lib/grading.js so both
 * paths cannot drift.
 */
import express from 'express';
import cors from 'cors';
import { gradeSubmission, GROQ_MODEL, REASONING_EFFORT } from './lib/grading.js';
import { checkRateLimit, clientKey } from './lib/rateLimit.js';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.post('/api/grade', async (req, res) => {
  const limit = checkRateLimit(clientKey(req.headers, req.ip));
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    return res.status(429).json({ error: limit.reason });
  }

  const { status, body } = await gradeSubmission(req.body);
  res.status(status).json(body);
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model: GROQ_MODEL,
    reasoningEffort: REASONING_EFFORT || 'default',
    hasApiKey: Boolean(process.env.GROQ_API_KEY),
  });
});

app.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
  console.log(`Grading model: ${GROQ_MODEL}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY is not set. Grading requests will fail until you add it to .env.');
  }
});
