import FingerprintJS from '@fingerprintjs/fingerprintjs';

let _cached: string | null = null;

export async function getFingerprint(): Promise<string> {
  if (_cached) return _cached;
  if (typeof window === 'undefined') return 'ssr';
  const fp = await FingerprintJS.load();
  const { visitorId } = await fp.get();
  _cached = visitorId;
  return visitorId;
}
