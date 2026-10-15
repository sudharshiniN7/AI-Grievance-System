/**
 * AI Service Client
 * --------------------
 * Thin HTTP client for calling the Python AI/NLP service. Isolated here
 * so the rest of the backend never constructs URLs or handles timeouts
 * directly — if the AI service's contract changes later, only this file
 * needs updating.
 *
 * Uses Node's built-in fetch (available in Node 18+) — no new dependency
 * required.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";
const AI_SERVICE_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 5000;

/**
 * Calls the AI service's POST /api/analyze endpoint.
 *
 * Does NOT throw on failure — instead returns { success: false, error }
 * so callers (the complaint controller) can decide how to proceed
 * without wrapping every call site in try/catch. This reflects the
 * "AI service failure should never block complaint creation" decision.
 *
 * @param {string} complaintText - the complaint description to analyze
 * @param {string|null} transportMode - optional transport mode
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function analyzeComplaint(complaintText, transportMode = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintText, transportMode }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorBody.message || `AI service responded with status ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return { success: false, error: "AI service request timed out." };
    }

    // Covers connection refused (AI service not running), DNS errors, etc.
    return { success: false, error: `AI service unreachable: ${error.message}` };
  }
}

module.exports = { analyzeComplaint };