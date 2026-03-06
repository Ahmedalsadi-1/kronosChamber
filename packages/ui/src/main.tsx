import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts';
import './index.css';
import App from './App.tsx';
import { SessionAuthGate } from './components/auth/SessionAuthGate';
import { ThemeSystemProvider } from './contexts/ThemeSystemContext';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { StartupRecoveryView, type StartupRecoveryError } from './components/system/StartupRecoveryView';
import './lib/debug';
import { syncDesktopSettings, initializeAppearancePreferences } from './lib/persistence';
import { startAppearanceAutoSave } from './lib/appearanceAutoSave';
import { applyPersistedDirectoryPreferences } from './lib/directoryPersistence';
import { startTypographyWatcher } from './lib/typographyWatcher';
import { startModelPrefsAutoSave } from './lib/modelPrefsAutoSave';
import { debugUtils } from './lib/debug';
import { copyTextToClipboard } from './lib/clipboard';
import { openDesktopPath } from './lib/desktop';
import { useBootHealthStore } from './stores/useBootHealthStore';
import type { RuntimeAPIs } from './lib/api/types';

declare global {
  interface Window {
    __KRONOSCHAMBER_RUNTIME_APIS__?: RuntimeAPIs;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

const toStartupError = (error: unknown, source?: string): StartupRecoveryError => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      source,
      timestamp: new Date().toISOString(),
    };
  }

  const message = typeof error === 'string'
    ? error
    : (() => {
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    })();

  return {
    message,
    source,
    timestamp: new Date().toISOString(),
  };
};

const renderStartupRecovery = (error: StartupRecoveryError, runtimeAPIs?: RuntimeAPIs) => {
  root.render(
    <StrictMode>
      <ThemeSystemProvider>
        <ThemeProvider>
          <StartupRecoveryView
            error={error}
            onRetry={() => {
              window.location.reload();
            }}
            onCopyDiagnostics={async () => {
              const baseReport = await debugUtils.buildDiagnosticsReport().catch(() => null);
              const payload = `${baseReport ? `${baseReport}\n\n` : ''}startup_error=${JSON.stringify(error, null, 2)}`;
              const result = await copyTextToClipboard(payload);
              if (!result.ok) {
                throw new Error(result.error || 'Failed to copy diagnostics');
              }
            }}
            onOpenLogs={async () => {
              let opened = false;

              if (runtimeAPIs?.runtime.isDesktop || Boolean((window as unknown as { __TAURI__?: unknown }).__TAURI__)) {
                try {
                  const { appLogDir } = await import('@tauri-apps/api/path');
                  const logsPath = await appLogDir();
                  if (typeof logsPath === 'string' && logsPath.trim().length > 0) {
                    opened = await openDesktopPath(logsPath);
                  }
                } catch {
                  opened = false;
                }
              }

              if (!opened) {
                throw new Error('Unable to open logs path in this runtime.');
              }
            }}
          />
        </ThemeProvider>
      </ThemeSystemProvider>
    </StrictMode>,
  );
};

const resolveRuntimeAPIs = (): RuntimeAPIs => {
  if (typeof window !== 'undefined' && window.__KRONOSCHAMBER_RUNTIME_APIS__) {
    return window.__KRONOSCHAMBER_RUNTIME_APIS__;
  }

  throw new Error('Runtime APIs not provided for legacy UI entrypoint.');
};

const registerDebugTokenInspector = () => {
  if (typeof window === 'undefined') {
    return;
  }

  (window as { debugContextTokens?: () => void }).debugContextTokens = () => {
    const sessionStore = (window as { __zustand_session_store__?: { getState: () => { currentSessionId?: string; messages: Map<string, { info: { role: string }; parts: { type: string }[] }[]>; sessionContextUsage: Map<string, unknown>; getContextUsage: (contextLimit: number, outputLimit: number) => unknown } } }).__zustand_session_store__;
    if (!sessionStore) {
      return;
    }

    const state = sessionStore.getState();
    const currentSessionId = state.currentSessionId;

    if (!currentSessionId) {
      return;
    }

    const sessionMessages = state.messages.get(currentSessionId) || [];
    const assistantMessages = sessionMessages.filter((m: { info: { role: string } }) => m.info.role === 'assistant');

    if (assistantMessages.length === 0) {
      return;
    }

    const lastMessage = assistantMessages[assistantMessages.length - 1];
    const tokens = (lastMessage.info as { tokens?: { input?: number; output?: number; reasoning?: number; cache?: { read?: number; write?: number } } }).tokens;

    if (tokens && typeof tokens === 'object') {
      console.debug('Token breakdown:', {
        base: (tokens.input || 0) + (tokens.output || 0) + (tokens.reasoning || 0),
        cache: tokens.cache ? (tokens.cache.read || 0) + (tokens.cache.write || 0) : 0
      });
    }

    void state.sessionContextUsage.get(currentSessionId);

    const configStore = (window as { __zustand_config_store__?: { getState: () => { getCurrentModel: () => { limit?: { context?: number } } | null } } }).__zustand_config_store__;
    if (configStore) {
      const currentModel = configStore.getState().getCurrentModel();
      const contextLimit = currentModel?.limit?.context || 0;
      const outputLimit =
        currentModel && currentModel.limit && typeof currentModel.limit === 'object'
          ? Math.max(((currentModel.limit as { output?: number }).output ?? 0), 0)
          : 0;

      if (contextLimit > 0) {
        void state.getContextUsage(contextLimit, outputLimit);
      }
    }
  };
};

useBootHealthStore.getState().reset();

let bootCompleted = false;
let startupFailed = false;
let runtimeAPIs: RuntimeAPIs | undefined;

let restoreGlobalHandlers: (() => void) | null = null;

const failStartup = (error: unknown, source?: string) => {
  if (startupFailed) {
    return;
  }
  startupFailed = true;
  restoreGlobalHandlers?.();
  const startupError = toStartupError(error, source);
  console.error('[startup] fatal bootstrap error', error);
  renderStartupRecovery(startupError, runtimeAPIs);
};

if (typeof window !== 'undefined') {
  const previousOnError = window.onerror;
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (bootCompleted) {
      return;
    }
    event.preventDefault();
    failStartup(event.reason, 'unhandledrejection');
  };

  window.onerror = (message, source, lineno, colno, error) => {
    if (!bootCompleted) {
      failStartup(error || message, `window.onerror:${String(source ?? 'unknown')}:${lineno ?? 0}:${colno ?? 0}`);
      return true;
    }
    if (typeof previousOnError === 'function') {
      return previousOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  restoreGlobalHandlers = () => {
    window.onerror = previousOnError;
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    restoreGlobalHandlers = null;
  };
}

const bootstrap = async () => {
  try {
    runtimeAPIs = resolveRuntimeAPIs();

    await syncDesktopSettings();
    await initializeAppearancePreferences();
    startAppearanceAutoSave();
    startModelPrefsAutoSave();
    startTypographyWatcher();
    await applyPersistedDirectoryPreferences();
    useBootHealthStore.getState().markBundleLoaded();

    registerDebugTokenInspector();

    root.render(
      <StrictMode>
        <ThemeSystemProvider>
          <ThemeProvider>
            <SessionAuthGate>
              <App apis={runtimeAPIs} />
            </SessionAuthGate>
          </ThemeProvider>
        </ThemeSystemProvider>
      </StrictMode>,
    );

    bootCompleted = true;
    restoreGlobalHandlers?.();
  } catch (error) {
    failStartup(error, 'bootstrap');
  }
};

await bootstrap();
