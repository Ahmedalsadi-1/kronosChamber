const CLIENT_ID_KEY = 'openchamber_client_id';
const WINDOW_ID_KEY = 'openchamber_window_id';

const randomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const readStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(key);
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

const ensureStorageId = (key: string): string => {
  const existing = readStorage(key);
  if (existing) return existing;
  const next = randomId();
  writeStorage(key, next);
  return next;
};

export const getClientId = (): string => ensureStorageId(CLIENT_ID_KEY);

export const getWindowId = (): string => {
  if (typeof window !== 'undefined') {
    const globalWindow = window as { __KRONOSCHAMBER_WINDOW_ID__?: string };
    if (typeof globalWindow.__KRONOSCHAMBER_WINDOW_ID__ === 'string' && globalWindow.__KRONOSCHAMBER_WINDOW_ID__.length > 0) {
      return globalWindow.__KRONOSCHAMBER_WINDOW_ID__;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = window.sessionStorage.getItem(WINDOW_ID_KEY);
      if (typeof stored === 'string' && stored.trim().length > 0) {
        (window as { __KRONOSCHAMBER_WINDOW_ID__?: string }).__KRONOSCHAMBER_WINDOW_ID__ = stored.trim();
        return stored.trim();
      }
    } catch {
      // ignore
    }
  }

  const next = randomId();
  if (typeof window !== 'undefined') {
    const globalWindow = window as { __KRONOSCHAMBER_WINDOW_ID__?: string };
    globalWindow.__KRONOSCHAMBER_WINDOW_ID__ = next;
    try {
      window.sessionStorage.setItem(WINDOW_ID_KEY, next);
    } catch {
      // ignore
    }
  }
  return next;
};

export const getIdentityHeaders = (): Record<string, string> => ({
  'x-client-id': getClientId(),
  'x-window-id': getWindowId(),
});
