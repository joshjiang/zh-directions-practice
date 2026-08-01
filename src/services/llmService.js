/**
 * Client for the backend grading API.
 *
 * The path is relative so it works behind the Vite dev proxy (see
 * vite.config.js) and in any deployment where the API is served from the same
 * origin. Set VITE_API_BASE_URL to point at a different host.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const REQUEST_TIMEOUT_MS = 60000;

/**
 * Sends user directions to the backend for LLM grading.
 * @param {string} userDirections - The user's written directions
 * @param {object} context - Map context: buildings, startPos, endPos, direction, language
 * @returns {Promise<{pathScore: number, languageScore: number, translation: string, feedback: string, nativeExample: string, path: object[]}>}
 * @throws {Error} If the request fails; callers are expected to surface the message.
 */
export const gradeDirections = async (userDirections, context) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDirections, context }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('The grading service timed out. Please try again.');
    }
    throw new Error(
      'Could not reach the grading service. Make sure the backend is running (npm run server).'
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data?.error) throw new Error(data.error);
    // The dev proxy answers with an empty text/plain 500 when nothing is
    // listening on the backend port, so a non-JSON body here almost always
    // means the grading server is down rather than a real grading failure.
    throw new Error(
      `The grading service is not responding (HTTP ${response.status}). ` +
        'Make sure the backend is running: npm run server.'
    );
  }

  if (!data) throw new Error('The grading service returned an unreadable response.');

  return data;
};
