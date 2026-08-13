import { gradeSubmission } from '../lib/grading.js';
import { checkRateLimit, clientKey } from '../lib/rateLimit.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const limit = checkRateLimit(clientKey(req.headers));
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    return res.status(429).json({ error: limit.reason });
  }

  // Vercel parses JSON bodies already; a string body means it did not.
  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  const { status, body: payload } = await gradeSubmission(body);
  return res.status(status).json(payload);
}

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
