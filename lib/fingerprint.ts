import FingerprintJS from '@fingerprintjs/fingerprintjs';

let _cached: string | null = null;
const STORAGE_KEY = 'dream-fingerprint-v1';

export async function getFingerprint(): Promise<string> {
  if (_cached) return _cached;
  if (typeof window === 'undefined') return 'ssr';

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      _cached = stored;
      return stored;
    }
  } catch {
    // Storage can be blocked; fingerprinting still works as a fallback.
  }

  const fp = await FingerprintJS.load();
  const { visitorId } = await fp.get();
  _cached = visitorId;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, visitorId);
    window.localStorage.setItem(STORAGE_KEY, visitorId);
  } catch {
    // Non-fatal: the in-memory cache still avoids repeated work in this tab.
  }
  return visitorId;
}
