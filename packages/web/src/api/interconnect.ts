import type {
  InterconnectAPI,
  InterconnectEvent,
  InterconnectSnapshot,
  InterconnectStatus,
} from '@kronoscode-ai/ui/lib/api/types';

type TauriGlobal = {
  core?: {
    invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
  };
  event?: {
    listen?: (
      event: string,
      handler: (evt: { payload?: unknown }) => void,
    ) => Promise<() => void>;
  };
};

const normalizeOrigin = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
};

const isDesktopLocalOriginActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  const globalWindow = window as Window & { __KRONOSCHAMBER_LOCAL_ORIGIN__?: string };
  const local = typeof globalWindow.__KRONOSCHAMBER_LOCAL_ORIGIN__ === 'string' ? globalWindow.__KRONOSCHAMBER_LOCAL_ORIGIN__ : '';
  const localOrigin = normalizeOrigin(local);
  const currentOrigin = normalizeOrigin(window.location.origin) || window.location.origin;
  return Boolean(localOrigin && currentOrigin && localOrigin === currentOrigin);
};

const getTauri = (): TauriGlobal | null => {
  if (typeof window === 'undefined') return null;
  const tauri = (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;
  if (!tauri?.core?.invoke) return null;
  if (!isDesktopLocalOriginActive()) return null;
  return tauri;
};

const normalizeStatus = (value: unknown): InterconnectStatus | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.state !== 'string') return null;
  return {
    state: record.state as InterconnectStatus['state'],
    reason: typeof record.reason === 'string' ? record.reason : null,
    host: typeof record.host === 'string' ? record.host : null,
    retryCount: typeof record.retryCount === 'number' ? record.retryCount : 0,
    relayMode: record.relayMode === 'desktop-relay' ? 'desktop-relay' : 'direct-sse',
    lastEventAt: typeof record.lastEventAt === 'number' ? record.lastEventAt : null,
  };
};

const normalizeSnapshot = (value: unknown): InterconnectSnapshot | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const status = normalizeStatus(record.status);
  if (!status) return null;
  const directServerState =
    typeof record.serverState === 'object' && record.serverState !== null
      ? (record.serverState as InterconnectSnapshot['serverState'])
      : null;
  const health =
    typeof record.health === 'object' && record.health !== null
      ? (record.health as Record<string, unknown>)
      : undefined;
  const statusSessions =
    typeof record.statusSessions === 'object' && record.statusSessions !== null
      ? (record.statusSessions as Record<string, unknown>)
      : undefined;
  const attentionSessions =
    typeof record.attentionSessions === 'object' && record.attentionSessions !== null
      ? (record.attentionSessions as Record<string, unknown>)
      : undefined;
  const activitySessions =
    typeof record.activitySessions === 'object' && record.activitySessions !== null
      ? (record.activitySessions as Record<string, unknown>)
      : undefined;
  const serverTime = typeof record.serverTime === 'number' ? record.serverTime : undefined;
  const aggregateServerState =
    health || statusSessions || attentionSessions || activitySessions || typeof serverTime === 'number'
      ? ({
          health,
          statusSessions,
          attentionSessions,
          activitySessions,
          serverTime,
        } satisfies NonNullable<InterconnectSnapshot['serverState']>)
      : null;

  return {
    status,
    lastEventId: typeof record.lastEventId === 'string' ? record.lastEventId : null,
    lastSuccessEventId: typeof record.lastSuccessEventId === 'string' ? record.lastSuccessEventId : null,
    lastHostDecision: typeof record.lastHostDecision === 'string' ? record.lastHostDecision : null,
    serverState: directServerState || aggregateServerState,
  };
};

const normalizeInterconnectEvent = (value: unknown): InterconnectEvent | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;

  if (typeof record.type === 'string') {
    return {
      type: record.type,
      properties: typeof record.properties === 'object' && record.properties !== null
        ? (record.properties as Record<string, unknown>)
        : {},
    };
  }

  const payload = record.payload;
  if (payload && typeof payload === 'object') {
    const payloadRecord = payload as Record<string, unknown>;
    if (typeof payloadRecord.type !== 'string') return null;
    const baseProperties =
      typeof payloadRecord.properties === 'object' && payloadRecord.properties !== null
        ? (payloadRecord.properties as Record<string, unknown>)
        : {};
    const directory = typeof record.directory === 'string' ? record.directory : null;
    const properties =
      directory && directory !== 'global'
        ? { ...baseProperties, directory }
        : baseProperties;

    return {
      type: payloadRecord.type,
      properties,
    };
  }

  return null;
};

const fetchServerSnapshot = async (): Promise<InterconnectSnapshot | null> => {
  try {
    const response = await fetch('/api/interconnect/state', {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return normalizeSnapshot(data);
  } catch {
    return null;
  }
};

export const createWebInterconnectAPI = (): InterconnectAPI => ({
  async getState() {
    const tauri = getTauri();
    if (tauri?.core?.invoke) {
      try {
        const value = await tauri.core.invoke('desktop_interconnect_state');
        const snapshot = normalizeSnapshot(value);
        if (snapshot) {
          return snapshot;
        }
      } catch {
        // fallback to HTTP snapshot
      }
    }
    return fetchServerSnapshot();
  },

  subscribeStatus(listener) {
    const tauri = getTauri();
    if (!tauri?.event?.listen) {
      return () => {};
    }

    let disposed = false;
    let unlisten: (() => void) | null = null;
    void tauri.event.listen('openchamber://interconnect/status', (evt) => {
      if (disposed) return;
      const status = normalizeStatus(evt.payload);
      if (!status) return;
      listener(status);
    }).then((fn) => {
      if (disposed) {
        fn();
        return;
      }
      unlisten = fn;
    }).catch(() => {
      // ignore
    });

    return () => {
      disposed = true;
      if (unlisten) {
        unlisten();
      }
    };
  },

  subscribeEvents(listener) {
    const tauri = getTauri();
    if (!tauri?.event?.listen) {
      return () => {};
    }

    let disposed = false;
    let unlisten: (() => void) | null = null;
    void tauri.event.listen('openchamber://interconnect/event', (evt) => {
      if (disposed) return;
      const event = normalizeInterconnectEvent(evt.payload);
      if (!event) return;
      listener(event);
    }).then((fn) => {
      if (disposed) {
        fn();
        return;
      }
      unlisten = fn;
    }).catch(() => {
      // ignore
    });

    return () => {
      disposed = true;
      if (unlisten) {
        unlisten();
      }
    };
  },

  async forceReconnect(reason?: string) {
    const tauri = getTauri();
    if (!tauri?.core?.invoke) {
      return false;
    }
    try {
      const result = await tauri.core.invoke('desktop_interconnect_force_reconnect', {
        reason: typeof reason === 'string' && reason.trim().length > 0 ? reason.trim() : null,
      });
      return result === true;
    } catch {
      return false;
    }
  },
});
