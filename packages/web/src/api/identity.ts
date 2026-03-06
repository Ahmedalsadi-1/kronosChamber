const CLIENT_ID_KEY = 'openchamber_client_id';
const WINDOW_ID_KEY = 'openchamber_window_id';

const randomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const ensureClientId = (): string => {
  if (typeof window === 'undefined') return randomId();
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing && existing.trim().length > 0) return existing.trim();
    const next = randomId();
    window.localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  } catch {
    return randomId();
  }
};

const ensureWindowId = (): string => {
  if (typeof window === 'undefined') return randomId();
  const globalWindow = window as { __KRONOSCHAMBER_WINDOW_ID__?: string };
  if (typeof globalWindow.__KRONOSCHAMBER_WINDOW_ID__ === 'string' && globalWindow.__KRONOSCHAMBER_WINDOW_ID__.length > 0) {
    return globalWindow.__KRONOSCHAMBER_WINDOW_ID__;
  }
  try {
    const existing = window.sessionStorage.getItem(WINDOW_ID_KEY);
    if (existing && existing.trim().length > 0) {
      globalWindow.__KRONOSCHAMBER_WINDOW_ID__ = existing.trim();
      return existing.trim();
    }
  } catch {
    // ignore
  }
  const next = randomId();
  globalWindow.__KRONOSCHAMBER_WINDOW_ID__ = next;
  try {
    window.sessionStorage.setItem(WINDOW_ID_KEY, next);
  } catch {
    // ignore
  }
  return next;
};

export const getIdentityHeaders = (): Record<string, string> => ({
  'x-client-id': ensureClientId(),
  'x-window-id': ensureWindowId(),
});
