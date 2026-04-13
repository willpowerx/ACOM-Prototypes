export const GEMINI_MODEL = 'gemini-2.5-flash';

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];

/**
 * fetch() wrapper with exponential back-off retry logic.
 * Throws on the final attempt if every retry failed.
 */
export async function fetchWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      if (attempt >= maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }
}

/**
 * Build the Gemini generateContent endpoint URL.
 */
export const geminiUrl = (apiKey) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
