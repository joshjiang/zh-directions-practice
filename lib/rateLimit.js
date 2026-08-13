/**
 * Per-IP request throttle.
 *
 * The point is not security, it is protecting a small shared token budget: the
 * Groq free tier allows roughly 31 gradings per DAY across everyone using the
 * deployment, so one person holding down submit can lock out the rest.
 *
 * State lives in memory, which on serverless means per warm instance rather
 * than globally. That is deliberate - it needs no database and still stops the
 * realistic case (one person, one browser, repeated submits). It will not stop
 * a distributed abuser; if you need that, put the app behind an auth check or
 * move this state into a shared store.
 */

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const MAX_IN_WINDOW = Number(process.env.RATE_LIMIT_MAX) || 4;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_DAY = Number(process.env.RATE_LIMIT_MAX_PER_DAY) || 40;

const hits = new Map();

/** Drops entries nobody has touched for a day, so the map cannot grow forever. */
const prune = (now) => {
  for (const [key, times] of hits) {
    if (!times.length || now - times[times.length - 1] > DAY_MS) hits.delete(key);
  }
};

/**
 * @param {string} key - client identifier, normally an IP address
 * @returns {{allowed: boolean, retryAfterSeconds?: number, reason?: string}}
 */
export const checkRateLimit = (key) => {
  const now = Date.now();
  if (hits.size > 500) prune(now);

  const times = (hits.get(key) || []).filter((t) => now - t < DAY_MS);
  const recent = times.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_IN_WINDOW) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    return {
      allowed: false,
      retryAfterSeconds,
      reason: `Too many submissions. Wait ${retryAfterSeconds}s and try again.`,
    };
  }

  if (times.length >= MAX_PER_DAY) {
    return {
      allowed: false,
      retryAfterSeconds: 3600,
      reason: 'Daily practice limit reached for this device. Try again tomorrow.',
    };
  }

  times.push(now);
  hits.set(key, times);
  return { allowed: true };
};

/** Best-effort client IP, trusting the proxy headers Vercel sets. */
export const clientKey = (headers, fallback = 'unknown') => {
  const forwarded = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return headers['x-real-ip'] || fallback;
};
