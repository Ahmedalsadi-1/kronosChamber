import React from 'react';
import {
  RiAddLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiCameraLine,
  RiCloseLine,
  RiCompassDiscoverLine,
  RiExternalLinkLine,
  RiLoader4Line,
  RiLock2Line,
  RiRefreshLine,
  RiSearch2Line,
  RiWindow2Line,
} from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/useSessionStore';
import { useBrowserRuntimeStore } from '@/stores/useBrowserRuntimeStore';
import {
  desktopBrowserBack,
  desktopBrowserClosePage,
  desktopBrowserForward,
  desktopBrowserInit,
  desktopBrowserNavigate,
  desktopBrowserNewPage,
  desktopBrowserReload,
  desktopBrowserSelectPage,
  desktopBrowserSetBounds,
  desktopBrowserState,
  desktopBrowserStop,
  isDesktopBrowserCommandReady,
  isDesktopLocalOriginActive,
  isDesktopShell,
  runDesktopCommand,
  type DesktopBrowserState,
} from '@/lib/desktop';

import { BrowserTabStrip } from '@/components/browser/BrowserTabStrip';

const DEFAULT_HOME_URL = 'https://www.bing.com';
const SEARCH_ENGINE_URL = 'https://www.bing.com/search?q=';
const DESKTOP_POLL_INTERVAL_MS = 1100;

const normalizeNavigationTarget = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  if (/^(localhost|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?(\/.*)?$/.test(trimmed)) {
    return `http://${trimmed}`;
  }

  if (/^[^\s]+\.[^\s]+/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return `${SEARCH_ENGINE_URL}${encodeURIComponent(trimmed)}`;
};

export const BrowserView: React.FC = () => {
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const createSession = useSessionStore((state) => state.createSession);
  const setPendingInputText = useSessionStore((state) => state.setPendingInputText);

  const bindSession = useBrowserRuntimeStore((state) => state.bindSession);
  const runAction = useBrowserRuntimeStore((state) => state.runAction);
  const refresh = useBrowserRuntimeStore((state) => state.refresh);
  const runtimeState = useBrowserRuntimeStore((state) => state.runtimeState);
  const frameDataUrl = useBrowserRuntimeStore((state) => state.frameDataUrl);
  const isRefreshing = useBrowserRuntimeStore((state) => state.isRefreshing);
  const isActionRunning = useBrowserRuntimeStore((state) => state.isActionRunning);
  const error = useBrowserRuntimeStore((state) => state.error);

  const [address, setAddress] = React.useState('');
  const [isAddressFocused, setIsAddressFocused] = React.useState(false);
  const [isCreatingSession, setIsCreatingSession] = React.useState(false);
  const [liveReloadNonce, setLiveReloadNonce] = React.useState(0);
  const [desktopState, setDesktopState] = React.useState<DesktopBrowserState | null>(null);
  const [desktopError, setDesktopError] = React.useState<string | null>(null);
  const [isDesktopActionRunning, setIsDesktopActionRunning] = React.useState(false);
  const [isDesktopSyncing, setIsDesktopSyncing] = React.useState(false);
  const livePaneRef = React.useRef<HTMLDivElement | null>(null);
  const autoCreateAttemptedRef = React.useRef(false);
  const autoLoadedSessionRef = React.useRef<string | null>(null);
  const boundsFrameRef = React.useRef<number | null>(null);
  const desktopShellActive = isDesktopShell();
  const desktopLiveEnabled = isDesktopBrowserCommandReady();
  const desktopLocalOriginActive = isDesktopLocalOriginActive();

  React.useEffect(() => {
    bindSession(currentSessionId ?? null);
  }, [bindSession, currentSessionId]);

  React.useEffect(() => {
    if (desktopLiveEnabled || currentSessionId || autoCreateAttemptedRef.current) {
      return;
    }
    autoCreateAttemptedRef.current = true;
    let cancelled = false;
    setIsCreatingSession(true);
    void createSession('Browser')
      .catch(() => {
        if (!cancelled) {
          autoCreateAttemptedRef.current = false;
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCreatingSession(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [createSession, currentSessionId, desktopLiveEnabled]);

  React.useEffect(() => {
    if (!desktopLiveEnabled) {
      setDesktopState(null);
      setDesktopError(null);
      return;
    }

    let cancelled = false;
    setIsDesktopSyncing(true);
    void desktopBrowserInit()
      .then((state) => {
        if (!cancelled && state) {
          setDesktopState(state);
          setDesktopError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDesktopError(err instanceof Error ? err.message : 'Failed to initialize desktop browser');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsDesktopSyncing(false);
        }
      });

    const interval = window.setInterval(() => {
      void desktopBrowserState()
        .then((state) => {
          if (!cancelled && state) {
            setDesktopState(state);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setDesktopError(err instanceof Error ? err.message : 'Failed to sync desktop browser');
          }
        });
    }, DESKTOP_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      void desktopBrowserSetBounds({ x: 0, y: 0, width: 1, height: 1, visible: false });
    };
  }, [desktopLiveEnabled]);

  const syncDesktopBounds = React.useCallback(() => {
    if (!desktopLiveEnabled) return;
    if (boundsFrameRef.current !== null) {
      window.cancelAnimationFrame(boundsFrameRef.current);
    }
    boundsFrameRef.current = window.requestAnimationFrame(() => {
      boundsFrameRef.current = null;
      const element = livePaneRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      void desktopBrowserSetBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 2 && rect.height > 2,
      }).then((state) => {
        if (state) {
          setDesktopState(state);
        }
      });
    });
  }, [desktopLiveEnabled]);

  React.useEffect(() => {
    if (!desktopLiveEnabled) {
      return;
    }
    syncDesktopBounds();
    const element = livePaneRef.current;
    const observer = new ResizeObserver(() => {
      syncDesktopBounds();
    });
    if (element) {
      observer.observe(element);
    }
    window.addEventListener('resize', syncDesktopBounds);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncDesktopBounds);
      if (boundsFrameRef.current !== null) {
        window.cancelAnimationFrame(boundsFrameRef.current);
        boundsFrameRef.current = null;
      }
    };
  }, [desktopLiveEnabled, syncDesktopBounds]);

  const runCommand = React.useCallback(
    async function <T>(run: (app?: any) => Promise<T>) {
      return runDesktopCommand(
        run,
        desktopLiveEnabled,
        setIsDesktopActionRunning,
        setDesktopState as any,
        setDesktopError
      );
    },
    [desktopLiveEnabled],
  );

  const pages = React.useMemo(
    () => (desktopLiveEnabled ? (desktopState?.pages ?? []) : (runtimeState?.pages ?? [])),
    [desktopLiveEnabled, desktopState?.pages, runtimeState?.pages],
  );

  const activePage = React.useMemo(() => {
    if (pages.length === 0) return null;
    return pages.find((page) => page.active) ?? pages[0];
  }, [pages]);

  const browserDisabled = !desktopLiveEnabled && runtimeState?.enabled === false;
  const isSecurePage = typeof activePage?.url === 'string' && activePage.url.startsWith('https://');
  const disableActions = desktopLiveEnabled
    ? isDesktopActionRunning
    : (isActionRunning || browserDisabled || !currentSessionId);
  const canUseAiRuntimeTools = Boolean(currentSessionId && !browserDisabled);

  React.useEffect(() => {
    if (!isAddressFocused && activePage?.url) {
      setAddress(activePage.url);
    }
  }, [activePage?.url, isAddressFocused]);

  const handleSubmitNavigate = React.useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const url = normalizeNavigationTarget(address);
    if (!url) return;

    if (desktopLiveEnabled) {
      await runCommand((app) => desktopBrowserNavigate(app, url));
      return;
    }
    await runAction({ action: 'navigate', payload: { type: 'url', url } });
  }, [address, desktopLiveEnabled, runAction, runCommand]);

  const handleReloadOrStop = React.useCallback(async () => {
    if (desktopLiveEnabled) {
      if (activePage?.isLoading) {
        await runCommand((app) => desktopBrowserStop(app));
        return;
      }
      await runCommand((app) => desktopBrowserReload(app));
      return;
    }
    if (activePage?.isLoading) {
      await runAction({ action: 'stop', payload: {} });
      return;
    }
    setLiveReloadNonce((value) => value + 1);
    await runAction({ action: 'reload', payload: {} });
  }, [activePage?.isLoading, desktopLiveEnabled, runAction, runCommand]);


  const handleOpenExternal = React.useCallback(async () => {
    const url = activePage?.url;
    if (!url) return;

    const tauri = (window as unknown as {
      __TAURI__?: { core?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> } };
    }).__TAURI__;

    if (tauri?.core?.invoke) {
      try {
        await tauri.core.invoke('desktop_new_window_at_url', { url });
        return;
      } catch {
        // Fall through to window.open.
      }
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }, [activePage?.url]);

  const handleSelectPage = React.useCallback(async (value: string | number) => {
    const pageIdx = typeof value === 'string' ? Number(value) : value;
    if (!Number.isInteger(pageIdx) || pageIdx < 0) return;

    if (desktopLiveEnabled) {
      await runCommand((app) => desktopBrowserSelectPage(app, pageIdx));
      return;
    }
    await runAction({ action: 'selectPage', payload: { pageIdx } });
  }, [desktopLiveEnabled, runAction, runCommand]);

  const liveSurfaceURL = React.useMemo(() => {
    const url = typeof activePage?.url === 'string' && activePage.url.trim().length > 0
      ? activePage.url.trim()
      : DEFAULT_HOME_URL;
    return url;
  }, [activePage?.url]);

  React.useEffect(() => {
    if (desktopLiveEnabled || !currentSessionId) {
      autoLoadedSessionRef.current = null;
      return;
    }
    if (!runtimeState?.enabled) {
      return;
    }
    if (autoLoadedSessionRef.current === currentSessionId) {
      return;
    }
    const currentURL = typeof activePage?.url === 'string' ? activePage.url.trim() : '';
    if (!currentURL || currentURL === 'about:blank') {
      autoLoadedSessionRef.current = currentSessionId;
      void runAction({ action: 'navigate', payload: { type: 'url', url: DEFAULT_HOME_URL } }).catch(() => {
        autoLoadedSessionRef.current = null;
      });
      return;
    }
    autoLoadedSessionRef.current = currentSessionId;
  }, [activePage?.url, currentSessionId, desktopLiveEnabled, runAction, runtimeState?.enabled]);

  const handleNewPage = React.useCallback(async () => {
    if (desktopLiveEnabled) {
      await runCommand((app) => desktopBrowserNewPage(app, 'about:blank'));
      return;
    }
    await runAction({ action: 'newPage', payload: { url: 'about:blank' } });
  }, [desktopLiveEnabled, runAction, runCommand]);

  const handleClosePage = React.useCallback(async (index: number) => {
    if (desktopLiveEnabled) {
      await runCommand((app) => desktopBrowserClosePage(app, index));
      return;
    }
    await runAction({ action: 'closePage', payload: { pageIdx: index } });
  }, [desktopLiveEnabled, runAction, runCommand]);

  if (!desktopLiveEnabled && !currentSessionId) {

    return (
      <div className="flex h-full items-center justify-center bg-background p-6">
        <div className="max-w-lg rounded-xl border border-border/70 bg-card/70 px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground">
            <RiWindow2Line className="h-8 w-8" />
          </div>
          <h2 className="typography-ui-header text-xl font-semibold text-foreground">Browser</h2>
          <p className="typography-meta mt-3 leading-relaxed text-muted-foreground">
            {isCreatingSession ? 'Creating a session and loading browser...' : 'No session available.'}
          </p>
          {!isCreatingSession ? (
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={() => {
                autoCreateAttemptedRef.current = false;
                void createSession('Browser');
              }}
            >
              Create session
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <BrowserTabStrip
        pages={pages as any}
        onSelectPage={handleSelectPage as any}
        onClosePage={handleClosePage as any}
        onNewPage={handleNewPage}
        disableActions={disableActions}
      />
      
      <div className="flex items-center gap-2 border-b border-border/60 bg-card/40 px-3 py-2">
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => void (desktopLiveEnabled
                  ? runCommand((app) => desktopBrowserBack(app))
                  : runAction({ action: 'back', payload: {} }))}
                disabled={disableActions || !activePage?.canGoBack}
              >
                <RiArrowGoBackLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => void (desktopLiveEnabled
                  ? runCommand((app) => desktopBrowserForward(app))
                  : runAction({ action: 'forward', payload: {} }))}
                disabled={disableActions || !activePage?.canGoForward}
              >
                <RiArrowGoForwardLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => void handleReloadOrStop()}
                disabled={disableActions}
              >
                {activePage?.isLoading ? (
                  <RiCloseLine className="h-4 w-4" />
                ) : (
                  <RiRefreshLine className={cn('h-4 w-4', isRefreshing && !desktopLiveEnabled && 'animate-spin')} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{activePage?.isLoading ? 'Stop' : 'Reload'}</TooltipContent>
          </Tooltip>
        </div>

        <form className="flex min-w-0 flex-1 items-center" onSubmit={handleSubmitNavigate}>
          <div
            className={cn(
              'relative flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3 py-1.5',
              isAddressFocused && 'border-primary/50 bg-background ring-1 ring-primary/20',
            )}
          >
            {isAddressFocused ? (
              <RiSearch2Line className="h-3.5 w-3.5 text-muted-foreground/80" />
            ) : (
              <RiLock2Line className={cn('h-3.5 w-3.5', isSecurePage ? 'text-status-success' : 'text-muted-foreground/80')} />
            )}
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              onFocus={() => setIsAddressFocused(true)}
              onBlur={() => setIsAddressFocused(false)}
              className="min-w-0 flex-1 border-none bg-transparent font-sans text-xs outline-none placeholder:text-muted-foreground/60"
              placeholder="Search Bing or enter URL"
              disabled={disableActions}
              spellCheck={false}
              autoComplete="off"
            />
            {activePage?.isLoading && <RiLoader4Line className="h-3.5 w-3.5 animate-spin text-primary" />}
          </div>
        </form>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => void runAction({ action: 'screenshot', payload: { fullPage: true } })}
                disabled={disableActions || !canUseAiRuntimeTools}
              >
                <RiCameraLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canUseAiRuntimeTools ? 'Capture (AI runtime)' : 'Capture requires an active chat session'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleOpenExternal}
                disabled={disableActions || !activePage?.url}
              >
                <RiExternalLinkLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open external</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
        <div className="min-w-0 truncate">
          {activePage?.title || activePage?.url || 'No active page'}
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 uppercase tracking-wide',
              desktopLiveEnabled
                ? 'border-status-success/40 text-status-success'
                : 'border-status-warning/40 text-status-warning',
            )}
          >
            {desktopLiveEnabled ? 'Live desktop browser active' : 'AI relay fallback'}
          </span>
          {desktopShellActive && !desktopLocalOriginActive && desktopLiveEnabled ? (
            <span className="text-muted-foreground">desktop shell bridge</span>
          ) : null}
          <span>Pages {pages.length}</span>
          {desktopLiveEnabled && isDesktopSyncing ? <span className="text-primary">Syncing</span> : null}
          {activePage?.isLoading ? <span className="text-primary">Loading</span> : null}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-muted/10">
        {desktopLiveEnabled ? (
          <div ref={livePaneRef} className="h-full w-full bg-background" />
        ) : (
          <iframe
            key={`${liveSurfaceURL}:${liveReloadNonce}`}
            src={liveSurfaceURL}
            title="Live Browser"
            className="h-full w-full border-0 bg-white"
          />
        )}

        {isRefreshing && !desktopLiveEnabled ? (
          <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-border/70 bg-card/80 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur-sm">
            <RiLoader4Line className="h-3.5 w-3.5 animate-spin text-primary" />
            Syncing
          </div>
        ) : null}

        {frameDataUrl ? (
          <div className="pointer-events-none absolute bottom-3 right-3 hidden w-56 overflow-hidden rounded-lg border border-border/70 bg-card/85 shadow-lg backdrop-blur-md lg:block">
            <div className="border-b border-border/70 px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              AI Runtime View
            </div>
            <img
              src={frameDataUrl}
              alt="Browser runtime frame"
              className="h-32 w-full object-cover"
              draggable={false}
            />
          </div>
        ) : null}
      </div>

      {(desktopError || error) && (
        <div className="border-t border-status-error/30 bg-status-error/5 px-3 py-1.5 text-xs text-status-error">
          {desktopError || error}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-2 h-6 px-1.5 text-xs text-status-error"
            onClick={() => {
              if (desktopLiveEnabled) {
                void desktopBrowserState().then((state) => {
                  if (state) {
                    setDesktopState(state);
                    setDesktopError(null);
                  }
                });
                return;
              }
              void refresh();
            }}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};
