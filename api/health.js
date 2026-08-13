import { GROQ_MODEL, REASONING_EFFORT } from '../lib/grading.js';

export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    model: GROQ_MODEL,
    reasoningEffort: REASONING_EFFORT || 'default',
    hasApiKey: Boolean(process.env.GROQ_API_KEY),
  });
}
