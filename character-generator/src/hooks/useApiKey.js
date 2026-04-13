import { useState, useCallback } from 'react';

const STORAGE_KEY = 'gemini_api_key';
// Env var takes priority over anything stored locally
const ENV_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Manages the Gemini API key with a clear priority chain:
 *   1. VITE_GEMINI_API_KEY env var  (set at build time / in .env.local)
 *   2. Key saved by the user in the Settings panel  (persisted in localStorage)
 *   3. Nothing — the app will prompt the user to add one
 */
export function useApiKey() {
  const [localKey, setLocalKey] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ''
  );

  /** The key that will actually be used for API calls */
  const activeKey = ENV_KEY || localKey;

  /** Where the active key is coming from */
  const source = ENV_KEY ? 'env' : localKey ? 'local' : 'none';

  const saveKey = useCallback((key) => {
    const trimmed = key.trim();
    localStorage.setItem(STORAGE_KEY, trimmed);
    setLocalKey(trimmed);
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLocalKey('');
  }, []);

  return { activeKey, source, localKey, saveKey, clearKey };
}
