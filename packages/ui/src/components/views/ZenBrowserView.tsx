import React from "react"
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
  RiArrowDropDownLine,
  RiSplitCellsHorizontal,
  RiLayoutColumnLine,
  RiLayoutRowLine,
  RiMoreFill,
  RiCheckboxBlankCircleFill,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSessionStore } from "@/stores/useSessionStore"
import { useBrowserRuntimeStore } from "@/stores/useBrowserRuntimeStore"
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
  type DesktopBrowserPage,
} from "@/lib/desktop"

const DEFAULT_HOME_URL = "https://www.bing.com"
const SEARCH_ENGINE_URL = "https://www.bing.com/search?q="
const DESKTOP_POLL_INTERVAL_MS = 1100

const normalizeNavigationTarget = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ""

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed
  }

  if (/^(localhost|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?(\/.*)?$/.test(trimmed)) {
    return `http://${trimmed}`
  }

  if (/^[^\s]+\.[^\s]+/.test(trimmed)) {
    return `https://${trimmed}`
  }

  return `${SEARCH_ENGINE_URL}${encodeURIComponent(trimmed)}`
}

// Zen-inspired tab component
const ZenTab = ({
  page,
  isActive,
  onSelect,
  onClose,
}: {
  page: DesktopBrowserPage
  isActive: boolean
  onSelect: () => void
  onClose: () => void
}) => {
  const favicon = React.useMemo(() => {
    try {
      const url = new URL(page.url)
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`
    } catch {
      return null
    }
  }, [page.url])

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200",
        "border-b-2",
        isActive ? "bg-background/80 border-primary" : "bg-transparent border-transparent hover:bg-background/50",
      )}
    >
      {favicon && <img src={favicon} alt="" className="w-4 h-4 rounded-sm opacity-70" />}
      <span className={cn("text-sm truncate flex-1 min-w-0", isActive ? "text-foreground" : "text-muted-foreground")}>
        {page.title || "New Tab"}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className={cn(
          "opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all",
          "hover:bg-destructive/20 hover:text-destructive",
        )}
      >
        <RiCloseLine className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// Split view panel
const SplitViewPanel = ({
  pages,
  activePageID,
  onSelectPage,
  onClosePage,
  frameDataUrl,
  isLoading,
}: {
  pages: DesktopBrowserPage[]
  activePageID: string | null
  onSelectPage: (id: string) => void
  onClosePage: (id: string) => void
  frameDataUrl: string | null
  isLoading: boolean
}) => {
  const activePage = pages.find((p) => p.id === activePageID)

  return (
    <div className="flex-1 flex flex-col bg-background/95 backdrop-blur-xl">
      {/* Zen-style compact tab bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border/30 overflow-x-auto">
        {pages.map((page) => (
          <ZenTab
            key={page.id}
            page={page}
            isActive={page.id === activePageID}
            onSelect={() => onSelectPage(page.id)}
            onClose={() => onClosePage(page.id)}
          />
        ))}
        <button className="p-1.5 rounded-md hover:bg-background/50 text-muted-foreground transition-colors">
          <RiAddLine className="w-4 h-4" />
        </button>
      </div>

      {/* Browser frame */}
      <div className="flex-1 relative overflow-hidden">
        {frameDataUrl ? (
          <img
            src={frameDataUrl}
            alt="Browser preview"
            className="absolute inset-0 w-full h-full object-contain bg-background"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RiLoader4Line className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <RiCompassDiscoverLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No page loaded</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Zen address bar with glassmorphism
const ZenAddressBar = ({
  value,
  onChange,
  onSubmit,
  canGoBack,
  canGoForward,
  isLoading,
  onBack,
  onForward,
  onReload,
  onStop,
  onNewTab,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
  onBack: () => void
  onForward: () => void
  onReload: () => void
  onStop: () => void
  onNewTab: () => void
}) => {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-3 py-1.5 mx-2 my-1.5 rounded-xl transition-all duration-300",
        "bg-background/60 backdrop-blur-md border",
        isFocused ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/30 hover:border-border/50",
      )}
    >
      {/* Navigation buttons */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-border/30">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onBack}
              disabled={!canGoBack}
              className="p-1.5 rounded-lg hover:bg-background/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <RiArrowGoBackLine className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onForward}
              disabled={!canGoForward}
              className="p-1.5 rounded-lg hover:bg-background/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <RiArrowGoForwardLine className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Forward</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={isLoading ? onStop : onReload}
              className="p-1.5 rounded-lg hover:bg-background/80 transition-all"
            >
              {isLoading ? <RiLoader4Line className="w-4 h-4 animate-spin" /> : <RiRefreshLine className="w-4 h-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{isLoading ? "Stop" : "Reload"}</TooltipContent>
        </Tooltip>
      </div>

      {/* Address input */}
      <div className="flex-1 flex items-center gap-2 px-2">
        <RiSearch2Line className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search or enter URL..."
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
        />
        {value.startsWith("https://") && <RiLock2Line className="w-3.5 h-3.5 text-green-500/70" />}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 pl-2 border-l border-border/30">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onNewTab} className="p-1.5 rounded-lg hover:bg-background/80 transition-all">
              <RiAddLine className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>New Tab</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export const ZenBrowserView: React.FC = () => {
  const currentSessionId = useSessionStore((state) => state.currentSessionId)
  const createSession = useSessionStore((state) => state.createSession)
  const setPendingInputText = useSessionStore((state) => state.setPendingInputText)

  const bindSession = useBrowserRuntimeStore((state) => state.bindSession)
  const runAction = useBrowserRuntimeStore((state) => state.runAction)
  const refresh = useBrowserRuntimeStore((state) => state.refresh)
  const runtimeState = useBrowserRuntimeStore((state) => state.runtimeState)
  const frameDataUrl = useBrowserRuntimeStore((state) => state.frameDataUrl)
  const snapshotText = useBrowserRuntimeStore((state) => state.snapshotText)
  const isRefreshing = useBrowserRuntimeStore((state) => state.isRefreshing)
  const isActionRunning = useBrowserRuntimeStore((state) => state.isActionRunning)
  const error = useBrowserRuntimeStore((state) => state.error)

  const [address, setAddress] = React.useState("")
  const [isAddressFocused, setIsAddressFocused] = React.useState(false)
  const [isCreatingSession, setIsCreatingSession] = React.useState(false)
  const [liveReloadNonce, setLiveReloadNonce] = React.useState(0)
  const [desktopState, setDesktopState] = React.useState<DesktopBrowserPage[]>([])
  const [activePageId, setActivePageId] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<"single" | "split-h" | "split-v">("single")

  const desktopShellActive = isDesktopShell()
  const desktopLiveEnabled = isDesktopBrowserCommandReady()

  // Extract pages from runtime state
  const pages = React.useMemo(() => {
    if (!runtimeState?.pages) return []
    return runtimeState.pages as DesktopBrowserPage[]
  }, [runtimeState?.pages])

  const activePage = React.useMemo(() => {
    return pages.find((p) => p.id === (activePageId ?? runtimeState?.activePageID)) ?? pages[0]
  }, [pages, activePageId, runtimeState?.activePageID])

  // Poll for desktop state
  React.useEffect(() => {
    if (!desktopShellActive || !desktopLiveEnabled) return

    let cancelled = false
    let lastState = ""

    const poll = async () => {
      if (cancelled) return
      try {
        const state = await desktopBrowserState()
        if (cancelled) return
        const stateStr = JSON.stringify(state)
        if (stateStr !== lastState) {
          lastState = stateStr
          setDesktopState(state?.pages ?? [])
          if (state?.activePageID && !activePageId) {
            setActivePageId(state.activePageID)
          }
        }
      } catch {
        // Ignore
      }
    }

    poll()
    const interval = setInterval(poll, DESKTOP_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [desktopShellActive, desktopLiveEnabled, activePageId])

  // Get all pages to display (desktop or runtime)
  const displayPages = desktopShellActive && desktopLiveEnabled ? desktopState : pages
  const currentActivePageId =
    desktopShellActive && desktopLiveEnabled
      ? (activePageId ?? desktopState[0]?.id)
      : (runtimeState?.activePageID ?? pages[0]?.id)

  const [isDesktopActionRunning, setIsDesktopActionRunning] = React.useState(false)
  const [desktopError, setDesktopError] = React.useState<string | null>(null)

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

  const handleNavigate = React.useCallback(
    async (url: string) => {
      const normalized = normalizeNavigationTarget(url)
      if (desktopShellActive && desktopLiveEnabled) {
        await runCommand((app: any) => desktopBrowserNavigate(app, normalized))
      }
      setAddress(normalized)
    },
    [desktopShellActive, desktopLiveEnabled, runCommand],
  )

  const handleBack = React.useCallback(async () => {
    if (desktopShellActive && desktopLiveEnabled) {
      await runCommand((app: any) => desktopBrowserBack(app))
    }
  }, [desktopShellActive, desktopLiveEnabled, runCommand])

  const handleForward = React.useCallback(async () => {
    if (desktopShellActive && desktopLiveEnabled) {
      await runCommand((app: any) => desktopBrowserForward(app))
    }
  }, [desktopShellActive, desktopLiveEnabled, runCommand])

  const handleReload = React.useCallback(async () => {
    if (desktopShellActive && desktopLiveEnabled) {
      await runCommand((app: any) => desktopBrowserReload(app))
    }
  }, [desktopShellActive, desktopLiveEnabled, runCommand])

  const handleStop = React.useCallback(async () => {
    if (desktopShellActive && desktopLiveEnabled) {
      await runCommand((app: any) => desktopBrowserStop(app))
    }
  }, [desktopShellActive, desktopLiveEnabled, runCommand])

  const handleNewTab = React.useCallback(async () => {
    if (desktopShellActive && desktopLiveEnabled) {
      await runCommand((app: any) => desktopBrowserNewPage(app, 'about:blank'))
    }
  }, [desktopShellActive, desktopLiveEnabled, runCommand])

  const handleSelectPage = React.useCallback(
    async (pageId: string | number) => {
      if (desktopShellActive && desktopLiveEnabled) {
        const idx = typeof pageId === 'string' ? parseInt(pageId, 10) : pageId
        await runCommand((app: any) => desktopBrowserSelectPage(app, idx))
        setActivePageId(String(pageId))
      }
    },
    [desktopShellActive, desktopLiveEnabled, runCommand],
  )

  const handleClosePage = React.useCallback(
    async (pageId: string | number) => {
      if (desktopShellActive && desktopLiveEnabled) {
        const idx = typeof pageId === 'string' ? parseInt(pageId, 10) : pageId
        await runCommand((app: any) => desktopBrowserClosePage(app, idx))
      }
    },
    [desktopShellActive, desktopLiveEnabled, runCommand],
  )

  // Zen-style header with split view controls
  const BrowserHeader = () => (
    <div className="flex items-center justify-between px-2 py-1.5 bg-background/40 backdrop-blur-sm border-b border-border/20">
      {/* Logo/Brand */}
      <div className="flex items-center gap-2 px-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">Z</span>
        </div>
        <span className="text-sm font-medium">Zen Browser</span>
      </div>

      {/* Split view controls */}
      <div className="flex items-center gap-1 px-2 border-x border-border/20">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setViewMode("single")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "single" ? "bg-primary/20 text-primary" : "hover:bg-background/80 text-muted-foreground",
              )}
            >
              <RiWindow2Line className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Single View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setViewMode("split-h")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "split-h" ? "bg-primary/20 text-primary" : "hover:bg-background/80 text-muted-foreground",
              )}
            >
              <RiSplitCellsHorizontal className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Horizontal Split</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setViewMode("split-v")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "split-v" ? "bg-primary/20 text-primary" : "hover:bg-background/80 text-muted-foreground",
              )}
            >
              <RiLayoutColumnLine className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Vertical Split</TooltipContent>
        </Tooltip>
      </div>

      {/* Window controls placeholder */}
      <div className="flex items-center gap-1 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-background/80 text-muted-foreground transition-all">
              <RiMoreFill className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>More</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )

  // Loading state
  if (isRefreshing || isActionRunning) {
    return (
      <div className="h-full flex flex-col bg-background">
        <BrowserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading browser...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col bg-background">
        <BrowserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <RiCloseLine className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-destructive font-medium">Browser Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render split view if enabled
  if (viewMode !== "single" && displayPages.length > 0) {
    const mid = Math.ceil(displayPages.length / 2)
    const leftPages = displayPages.slice(0, mid)
    const rightPages = displayPages.slice(mid)

    return (
      <div
        className={cn(
          "h-full flex flex-col bg-gradient-to-b from-background/50 to-background",
          viewMode === "split-v" ? "flex-row" : "flex-col",
        )}
      >
        <BrowserHeader />

        {/* Zen Address Bar */}
        <ZenAddressBar
          value={address}
          onChange={setAddress}
          onSubmit={() => handleNavigate(address)}
          canGoBack={activePage?.canGoBack ?? false}
          canGoForward={activePage?.canGoForward ?? false}
          isLoading={activePage?.isLoading ?? false}
          onBack={handleBack}
          onForward={handleForward}
          onReload={handleReload}
          onStop={handleStop}
          onNewTab={handleNewTab}
        />

        <div className={cn("flex-1 flex gap-0.5 p-0.5", viewMode === "split-v" ? "flex-row" : "flex-col")}>
          <SplitViewPanel
            pages={leftPages}
            activePageID={leftPages[0]?.id}
            onSelectPage={handleSelectPage}
            onClosePage={handleClosePage}
            frameDataUrl={leftPages[0]?.id === currentActivePageId ? frameDataUrl : null}
            isLoading={leftPages[0]?.isLoading ?? false}
          />
          {rightPages.length > 0 && (
            <>
              <div className={cn("bg-border/30", viewMode === "split-v" ? "w-px" : "h-px")} />
              <SplitViewPanel
                pages={rightPages}
                activePageID={rightPages[0]?.id}
                onSelectPage={handleSelectPage}
                onClosePage={handleClosePage}
                frameDataUrl={rightPages[0]?.id === currentActivePageId ? frameDataUrl : null}
                isLoading={rightPages[0]?.isLoading ?? false}
              />
            </>
          )}
        </div>
      </div>
    )
  }

  // Single view
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background/50 to-background">
      <BrowserHeader />

      {/* Zen Address Bar */}
      <ZenAddressBar
        value={address}
        onChange={setAddress}
        onSubmit={() => handleNavigate(address)}
        canGoBack={activePage?.canGoBack ?? false}
        canGoForward={activePage?.canGoForward ?? false}
        isLoading={activePage?.isLoading ?? false}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onStop={handleStop}
        onNewTab={handleNewTab}
      />

      {/* Tab bar - Zen style */}
      {displayPages.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 border-b border-border/20 overflow-x-auto">
          {displayPages.map((page) => (
            <ZenTab
              key={page.id}
              page={page}
              isActive={page.id === currentActivePageId}
              onSelect={() => handleSelectPage(page.id)}
              onClose={() => handleClosePage(page.id)}
            />
          ))}
          <button
            onClick={handleNewTab}
            className="p-1.5 rounded-md hover:bg-background/50 text-muted-foreground transition-colors"
          >
            <RiAddLine className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Browser frame */}
      <div className="flex-1 relative overflow-hidden">
        {frameDataUrl ? (
          <img
            src={frameDataUrl}
            alt="Browser preview"
            className="absolute inset-0 w-full h-full object-contain bg-background"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="text-center text-muted-foreground">
              <RiCompassDiscoverLine className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">Zen Browser</p>
              <p className="text-sm opacity-60">Enter a URL or search to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar - Zen style */}
      <div className="flex items-center justify-between px-3 py-1 bg-background/40 backdrop-blur-sm border-t border-border/20 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {activePage?.isLoading && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Loading
            </span>
          )}
          {activePage?.canGoBack && <span>Back available</span>}
        </div>
        <div className="flex items-center gap-3">
          <span>
            {displayPages.length} tab{displayPages.length !== 1 ? "s" : ""}
          </span>
          {activePage && <span className="truncate max-w-xs">{activePage.title}</span>}
        </div>
      </div>
    </div>
  )
}

export default ZenBrowserView
