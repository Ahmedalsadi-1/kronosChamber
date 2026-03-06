import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { isDesktopShell, isTauriShell } from '@/lib/desktop';
import { updateDesktopSettings } from '@/lib/persistence';
import { reloadKronosCodeConfiguration } from '@/stores/useAgentsStore';

export const KronosCodeCliSettings: React.FC = () => {
  const [value, setValue] = React.useState('');
  const [aiBrowserEnabled, setAiBrowserEnabled] = React.useState(false);
  const [browserOpenAtStartup, setBrowserOpenAtStartup] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/config/settings', {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          return;
        }
        const data = (await response.json().catch(() => null)) as null | {
          kronoscodeBinary?: unknown;
          aiBrowserEnabled?: unknown;
          browserOpenAtStartup?: unknown;
        };
        if (cancelled || !data) {
          return;
        }
        const next = typeof data.kronoscodeBinary === 'string' ? data.kronoscodeBinary.trim() : '';
        const nextAiBrowserEnabled =
          typeof data.aiBrowserEnabled === 'boolean' ? data.aiBrowserEnabled : false;
        const nextBrowserOpenAtStartup =
          typeof data.browserOpenAtStartup === 'boolean' ? data.browserOpenAtStartup : false;
        setValue(next);
        setAiBrowserEnabled(nextAiBrowserEnabled);
        setBrowserOpenAtStartup(nextBrowserOpenAtStartup);
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBrowse = React.useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!isDesktopShell() || !isTauriShell()) {
      return;
    }

    const tauri = (window as unknown as { __TAURI__?: { dialog?: { open?: (opts: Record<string, unknown>) => Promise<unknown> } } }).__TAURI__;
    if (!tauri?.dialog?.open) {
      return;
    }

    try {
      const selected = await tauri.dialog.open({
        title: 'Select kronoscode binary',
        multiple: false,
        directory: false,
      });
      if (typeof selected === 'string' && selected.trim().length > 0) {
        setValue(selected.trim());
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveAndReload = React.useCallback(async () => {
    setIsSaving(true);
    try {
      await updateDesktopSettings({
        kronoscodeBinary: value.trim(),
        aiBrowserEnabled,
        browserOpenAtStartup,
      });
      await reloadKronosCodeConfiguration({ message: 'Restarting KronosCode…', mode: 'projects', scopes: ['all'] });
    } finally {
      setIsSaving(false);
    }
  }, [aiBrowserEnabled, browserOpenAtStartup, value]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="typography-ui-header font-semibold text-foreground">KronosCode CLI</h3>
        <p className="typography-meta text-muted-foreground">
          Optional absolute path to the <code className="font-mono text-xs">kronoscode</code> binary.
          Useful when your desktop app launch environment has a stale PATH.
          If your <code className="font-mono text-xs">kronoscode</code> shim requires Node/Bun (e.g. <code className="font-mono text-xs">env node</code> or <code className="font-mono text-xs">env bun</code>), make sure that runtime is installed.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/Users/you/.bun/bin/kronoscode"
          disabled={isLoading || isSaving}
          className="flex-1 font-mono text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleBrowse}
          disabled={isLoading || isSaving || !isDesktopShell() || !isTauriShell()}
        >
          Browse
        </Button>
        <Button
          type="button"
          onClick={handleSaveAndReload}
          disabled={isLoading || isSaving}
        >
          {isSaving ? 'Saving…' : 'Save + Reload'}
        </Button>
      </div>

      <div className="typography-micro text-muted-foreground">
        Tip: you can also use <span className="font-mono">KRONOSCODE_BINARY</span> env var, but this setting persists in
        <span className="font-mono"> ~/.config/openchamber/settings.json</span>.
      </div>

      <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2">
        <div className="space-y-1">
          <p className="typography-ui-label text-foreground">Enable AI Browser tools</p>
          <p className="typography-micro text-muted-foreground">
            Sets <span className="font-mono">KRONOSCODE_ENABLE_AI_BROWSER</span> for managed KronosCode restarts.
          </p>
        </div>
        <Switch
          checked={aiBrowserEnabled}
          onCheckedChange={setAiBrowserEnabled}
          disabled={isLoading || isSaving}
          aria-label="Enable AI Browser tools"
        />
      </div>

      <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2">
        <div className="space-y-1">
          <p className="typography-ui-label text-foreground">Open Browser at startup</p>
          <p className="typography-micro text-muted-foreground">
            When enabled in desktop runtime, Browser tab opens automatically on app launch.
          </p>
        </div>
        <Switch
          checked={browserOpenAtStartup}
          onCheckedChange={setBrowserOpenAtStartup}
          disabled={isLoading || isSaving}
          aria-label="Open Browser at startup"
        />
      </div>
    </div>
  );
};
