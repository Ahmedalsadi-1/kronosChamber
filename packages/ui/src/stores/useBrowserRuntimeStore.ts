import { create } from 'zustand';
import {
  getBrowserState,
  getBrowserFrame,
  runBrowserAction,
  type RuntimeBrowserActionRequest,
} from '@/lib/runtimeSdk';
import {
  kronoscodeClient,
  type BrowserRuntimeEvent,
  type BrowserRuntimeState,
} from '@/lib/kronoscode/client';

const POLL_INTERVAL_MS = 1500;
const EVENT_REFRESH_DEBOUNCE_MS = 120;

let boundSessionID: string | null = null;
let pollTimer: number | null = null;
let refreshTimer: number | null = null;
let browserEventsUnsubscribe: (() => void) | null = null;
let refreshInFlight: Promise<void> | null = null;

const clearRuntimeListeners = () => {
  if (pollTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(pollTimer);
  }
  pollTimer = null;

  if (refreshTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(refreshTimer);
  }
  refreshTimer = null;

  if (browserEventsUnsubscribe) {
    try {
      browserEventsUnsubscribe();
    } catch {
      // ignore
    }
  }
  browserEventsUnsubscribe = null;
};

const toFrameDataUrl = (base64: string, mime?: string) => `data:${mime || 'image/png'};base64,${base64}`;

type BrowserRuntimeStore = {
  sessionID: string | null;
  runtimeState: BrowserRuntimeState | null;
  frameDataUrl: string | null;
  snapshotText: string;
  isRefreshing: boolean;
  isActionRunning: boolean;
  isEventStreamConnected: boolean;
  error: string | null;
  bindSession: (sessionID: string | null) => void;
  refresh: () => Promise<void>;
  runAction: (
    request: RuntimeBrowserActionRequest
  ) => Promise<unknown>;
  setSnapshotText: (value: string) => void;
  reset: () => void;
};

export const useBrowserRuntimeStore = create<BrowserRuntimeStore>((set, get) => {
  const scheduleRefresh = (delayMs = EVENT_REFRESH_DEBOUNCE_MS) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (refreshTimer !== null) {
      return;
    }
    refreshTimer = window.setTimeout(() => {
      refreshTimer = null;
      void get().refresh();
    }, Math.max(0, delayMs));
  };

  const handleBrowserRuntimeEvent = (event: BrowserRuntimeEvent) => {
    const activeSession = get().sessionID;
    if (!activeSession || event.sessionID !== activeSession) {
      return;
    }
    set({ isEventStreamConnected: true });
    scheduleRefresh();
  };

  return {
    sessionID: null,
    runtimeState: null,
    frameDataUrl: null,
    snapshotText: '',
    isRefreshing: false,
    isActionRunning: false,
    isEventStreamConnected: false,
    error: null,

    bindSession: (sessionID) => {
      const nextSession = typeof sessionID === 'string' && sessionID.trim().length > 0 ? sessionID.trim() : null;
      if (boundSessionID === nextSession) {
        return;
      }

      boundSessionID = nextSession;
      clearRuntimeListeners();
      refreshInFlight = null;

      if (!nextSession) {
        set({
          sessionID: null,
          runtimeState: null,
          frameDataUrl: null,
          snapshotText: '',
          isRefreshing: false,
          isActionRunning: false,
          isEventStreamConnected: false,
          error: null,
        });
        return;
      }

      set({
        sessionID: nextSession,
        runtimeState: null,
        frameDataUrl: null,
        snapshotText: '',
        isRefreshing: false,
        isActionRunning: false,
        isEventStreamConnected: false,
        error: null,
      });

      browserEventsUnsubscribe = kronoscodeClient.subscribeToBrowserEvents(
        nextSession,
        handleBrowserRuntimeEvent,
        () => {
          if (get().sessionID === nextSession) {
            set({ isEventStreamConnected: false });
          }
        },
        () => {
          if (get().sessionID === nextSession) {
            set({ isEventStreamConnected: true });
            scheduleRefresh(0);
          }
        }
      );

      if (typeof window !== 'undefined') {
        pollTimer = window.setInterval(() => {
          if (get().sessionID !== nextSession) {
            return;
          }
          void get().refresh();
        }, POLL_INTERVAL_MS);
      }

      scheduleRefresh(0);
    },

    refresh: async () => {
      const sessionID = get().sessionID;
      if (!sessionID) {
        return;
      }
      if (refreshInFlight) {
        return refreshInFlight;
      }

      set({ isRefreshing: true });
      refreshInFlight = (async () => {
        try {
          const state = await getBrowserState(sessionID);
          if (get().sessionID !== sessionID) {
            return;
          }

          if (!state.enabled) {
            set({
              runtimeState: state as any,
              frameDataUrl: null,
              error: state.lastError ?? 'AI Browser is disabled',
            });
            return;
          }

          const frame = await getBrowserFrame(sessionID);
          if (get().sessionID !== sessionID) {
            return;
          }

          set({
            runtimeState: state as any,
            frameDataUrl: typeof frame.base64 === 'string' && frame.base64.length > 0
              ? toFrameDataUrl(frame.base64, frame.mime)
              : null,
            error: null,
          });
        } catch (error) {
          if (get().sessionID !== sessionID) {
            return;
          }
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh browser',
          });
        } finally {
          if (get().sessionID === sessionID) {
            set({ isRefreshing: false });
          }
        }
      })();

      try {
        await refreshInFlight;
      } finally {
        refreshInFlight = null;
      }
    },

    runAction: async (request) => {
      const sessionID = get().sessionID;
      if (!sessionID) {
        throw new Error('No active session selected');
      }

      try {
        set({ isActionRunning: true });
        const result = await runBrowserAction(sessionID, request.action as any, request.payload);

        if (
          request.action === 'snapshot' &&
          result &&
          typeof result === 'object' &&
          typeof (result as { text?: unknown }).text === 'string'
        ) {
          set({ snapshotText: (result as { text: string }).text });
        }

        if (
          request.action === 'screenshot' &&
          result &&
          typeof result === 'object' &&
          typeof (result as { base64?: unknown }).base64 === 'string'
        ) {
          const typed = result as { base64: string; mime?: string };
          set({ frameDataUrl: toFrameDataUrl(typed.base64, typed.mime) });
        }

        set({ error: null });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Browser action failed';
        set({ error: message });
        throw error;
      } finally {
        set({ isActionRunning: false });
        scheduleRefresh(0);
      }
    },

    setSnapshotText: (value) => {
      set({ snapshotText: value });
    },

    reset: () => {
      boundSessionID = null;
      clearRuntimeListeners();
      refreshInFlight = null;
      set({
        sessionID: null,
        runtimeState: null,
        frameDataUrl: null,
        snapshotText: '',
        isRefreshing: false,
        isActionRunning: false,
        isEventStreamConnected: false,
        error: null,
      });
    },
  };
});
