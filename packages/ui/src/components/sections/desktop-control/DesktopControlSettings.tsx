import React from 'react';
import {
  RiCheckLine,
  RiCloseLine,
  RiComputerLine,
  RiExternalLinkLine,
  RiInformationLine,
  RiInstallLine,
  RiLoader4Line,
  RiSettings4Line,
  RiShieldKeyholeLine,
} from '@remixicon/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui';
import { copyTextToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';
import { useDirectoryStore } from '@/stores/useDirectoryStore';
import { useMcpConfigStore, type McpDraft } from '@/stores/useMcpConfigStore';
import { useMcpStore } from '@/stores/useMcpStore';
import { useUIStore } from '@/stores/useUIStore';
import {
  DESKTOP_CONTROL_MCP_SERVERS,
  type DesktopControlEnvField,
  type DesktopControlMcpServer,
} from '@/lib/desktop-control';

type EnvFormByServer = Record<string, Record<string, string>>;

interface DesktopControlSettingsProps {
  className?: string;
}

const buildDefaultEnvState = (): EnvFormByServer => {
  const state: EnvFormByServer = {};
  for (const server of DESKTOP_CONTROL_MCP_SERVERS) {
    const env: Record<string, string> = {};
    for (const field of [...server.requiredEnv, ...server.optionalEnv]) {
      env[field.key] = field.key === 'MACOS_PORT' ? '5900' : '';
    }
    state[server.id] = env;
  }
  return state;
};

const getServerError = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const error = record.error;
  if (typeof error === 'string' && error.trim().length > 0) {
    return error.trim();
  }
  return null;
};

const getServerStateLabel = (value: unknown): string => {
  if (!value || typeof value !== 'object') return 'Not connected';
  const state = (value as { status?: string }).status;
  if (state === 'connected') return 'Connected';
  if (state === 'failed') return 'Failed';
  if (state === 'needs_auth' || state === 'needs_client_registration') return 'Auth required';
  return typeof state === 'string' && state.length > 0 ? state : 'Not connected';
};

const toEnvArray = (env: Record<string, string>): Array<{ key: string; value: string }> => {
  return Object.entries(env)
    .map(([key, value]) => ({ key, value: value.trim() }))
    .filter((entry) => entry.value.length > 0);
};

const isRequiredSatisfied = (server: DesktopControlMcpServer, env: Record<string, string>): boolean => {
  return server.requiredEnv.every((field) => {
    if (field.required === false) return true;
    return Boolean(env[field.key]?.trim());
  });
};

const EnvField: React.FC<{
  field: DesktopControlEnvField;
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
}> = ({ field, value, disabled, onChange }) => {
  return (
    <label className="space-y-1">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{field.label}</span>
        {field.required ? <span className="text-status-error">*</span> : null}
      </div>
      <div className="relative">
        {field.secret ? <RiShieldKeyholeLine className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /> : null}
        <Input
          value={value}
          type={field.secret ? 'password' : 'text'}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={cn('h-9 text-xs', field.secret && 'pl-8')}
        />
      </div>
      {field.description ? (
        <div className="text-[11px] text-muted-foreground/80">{field.description}</div>
      ) : null}
    </label>
  );
};

const DesktopControlServerCard: React.FC<{
  server: DesktopControlMcpServer;
  installed: boolean;
  connected: boolean;
  statusLabel: string;
  statusError: string | null;
  envValues: Record<string, string>;
  busyAction: 'install' | 'remove' | 'connect' | 'disconnect' | null;
  onChangeEnv: (key: string, value: string) => void;
  onInstall: () => void;
  onRemove: () => void;
  onToggleConnection: () => void;
}> = ({
  server,
  installed,
  connected,
  statusLabel,
  statusError,
  envValues,
  busyAction,
  onChangeEnv,
  onInstall,
  onRemove,
  onToggleConnection,
}) => {
  const canInstall = isRequiredSatisfied(server, envValues);
  const isBusy = busyAction !== null;

  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <RiComputerLine className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="truncate font-medium">{server.name}</h4>
            <Badge variant="outline" className="text-[10px]">{server.language}</Badge>
            <Badge variant="secondary" className="text-[10px]">{server.stars} stars</Badge>
            <Badge variant={connected ? 'default' : 'outline'} className="text-[10px]">
              {statusLabel}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{server.description}</p>
          <a
            href={server.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            upstream repository
            <RiExternalLinkLine className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {server.features.map((feature) => (
          <Badge key={feature} variant="ghost" className="text-[10px]">
            {feature}
          </Badge>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {server.requiredEnv.map((field) => (
          <EnvField
            key={field.key}
            field={field}
            value={envValues[field.key] ?? ''}
            disabled={isBusy}
            onChange={(next) => onChangeEnv(field.key, next)}
          />
        ))}
        {server.optionalEnv.map((field) => (
          <EnvField
            key={field.key}
            field={field}
            value={envValues[field.key] ?? ''}
            disabled={isBusy}
            onChange={(next) => onChangeEnv(field.key, next)}
          />
        ))}
      </div>

      {statusError ? (
        <div className="rounded-md border border-status-error/30 bg-status-error/5 px-2.5 py-2 text-xs text-status-error">
          {statusError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {!installed ? (
          <Button size="sm" disabled={!canInstall || isBusy} onClick={onInstall} className="gap-1.5">
            {busyAction === 'install' ? <RiLoader4Line className="h-4 w-4 animate-spin" /> : <RiInstallLine className="h-4 w-4" />}
            Install (user scope)
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" disabled={isBusy} onClick={onToggleConnection} className="gap-1.5">
              {busyAction === 'connect' || busyAction === 'disconnect' ? (
                <RiLoader4Line className="h-4 w-4 animate-spin" />
              ) : connected ? (
                <RiCloseLine className="h-4 w-4" />
              ) : (
                <RiCheckLine className="h-4 w-4" />
              )}
              {connected ? 'Disconnect' : 'Connect'}
            </Button>
            <Button size="sm" variant="ghost" disabled={isBusy} onClick={onRemove} className="gap-1.5 text-status-error hover:text-status-error">
              {busyAction === 'remove' ? <RiLoader4Line className="h-4 w-4 animate-spin" /> : <RiCloseLine className="h-4 w-4" />}
              Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export function DesktopControlSettings({ className }: DesktopControlSettingsProps) {
  const directory = useDirectoryStore((state) => state.currentDirectory ?? null);
  const setSidebarSection = useUIStore((state) => state.setSidebarSection);

  const mcpServers = useMcpConfigStore((state) => state.mcpServers);
  const loadMcpConfigs = useMcpConfigStore((state) => state.loadMcpConfigs);
  const createMcp = useMcpConfigStore((state) => state.createMcp);
  const updateMcp = useMcpConfigStore((state) => state.updateMcp);
  const deleteMcp = useMcpConfigStore((state) => state.deleteMcp);

  const refreshStatus = useMcpStore((state) => state.refresh);
  const connectMcp = useMcpStore((state) => state.connect);
  const disconnectMcp = useMcpStore((state) => state.disconnect);

  const [busyByServer, setBusyByServer] = React.useState<Record<string, 'install' | 'remove' | 'connect' | 'disconnect' | null>>({});
  const [envByServer, setEnvByServer] = React.useState<EnvFormByServer>(() => buildDefaultEnvState());

  const statusMap = useMcpStore((state) => state.getStatusForDirectory(directory));

  React.useEffect(() => {
    void loadMcpConfigs();
    void refreshStatus({ directory, silent: true });
  }, [directory, loadMcpConfigs, refreshStatus]);

  const setServerBusy = React.useCallback((serverId: string, action: 'install' | 'remove' | 'connect' | 'disconnect' | null) => {
    setBusyByServer((prev) => ({ ...prev, [serverId]: action }));
  }, []);

  const updateEnvValue = React.useCallback((serverId: string, key: string, value: string) => {
    setEnvByServer((prev) => ({
      ...prev,
      [serverId]: {
        ...(prev[serverId] ?? {}),
        [key]: value,
      },
    }));
  }, []);

  const installServer = React.useCallback(async (server: DesktopControlMcpServer) => {
    const envValues = envByServer[server.id] ?? {};
    if (!isRequiredSatisfied(server, envValues)) {
      toast.error('Missing required fields', {
        description: 'Fill in required macOS connection fields before installing.',
      });
      return;
    }

    setServerBusy(server.id, 'install');
    try {
      const draft: McpDraft = {
        name: server.mcpName,
        scope: server.defaultScope,
        type: 'local',
        command: [server.command, ...server.args],
        url: '',
        environment: toEnvArray(envValues),
        enabled: true,
      };

      const existing = mcpServers.find((entry) => entry.name === server.mcpName);
      if (existing) {
        await updateMcp(server.mcpName, {
          scope: server.defaultScope,
          type: 'local',
          command: draft.command,
          environment: draft.environment,
          enabled: true,
        });
      } else {
        const created = await createMcp(draft);
        if (!created) {
          throw new Error('Failed to create MCP server config');
        }
      }

      await loadMcpConfigs();
      await refreshStatus({ directory, silent: true });
      try {
        await connectMcp(server.mcpName, directory);
      } catch {
        // Connection can fail until credentials/network are valid.
      }
      toast.success(`${server.name} installed`, {
        description: 'MCP config created in user scope and ready to connect.',
      });
    } catch (error) {
      toast.error(`Failed to install ${server.name}`, {
        description: error instanceof Error ? error.message : 'Unknown install error',
      });
    } finally {
      setServerBusy(server.id, null);
    }
  }, [connectMcp, createMcp, directory, envByServer, loadMcpConfigs, mcpServers, refreshStatus, setServerBusy, updateMcp]);

  const removeServer = React.useCallback(async (server: DesktopControlMcpServer) => {
    setServerBusy(server.id, 'remove');
    try {
      try {
        await disconnectMcp(server.mcpName, directory);
      } catch {
        // ignore disconnect failures during remove
      }

      const removed = await deleteMcp(server.mcpName);
      if (!removed) {
        throw new Error('Failed to delete MCP server config');
      }

      await loadMcpConfigs();
      await refreshStatus({ directory, silent: true });
      toast.success(`${server.name} removed`);
    } catch (error) {
      toast.error(`Failed to remove ${server.name}`, {
        description: error instanceof Error ? error.message : 'Unknown remove error',
      });
    } finally {
      setServerBusy(server.id, null);
    }
  }, [deleteMcp, directory, disconnectMcp, loadMcpConfigs, refreshStatus, setServerBusy]);

  const toggleConnection = React.useCallback(async (server: DesktopControlMcpServer, connected: boolean) => {
    setServerBusy(server.id, connected ? 'disconnect' : 'connect');
    try {
      if (connected) {
        await disconnectMcp(server.mcpName, directory);
      } else {
        await connectMcp(server.mcpName, directory);
      }
      await refreshStatus({ directory, silent: true });
    } catch (error) {
      toast.error(`Failed to ${connected ? 'disconnect' : 'connect'} ${server.name}`, {
        description: error instanceof Error ? error.message : 'Unknown MCP connection error',
      });
    } finally {
      setServerBusy(server.id, null);
    }
  }, [connectMcp, directory, disconnectMcp, refreshStatus, setServerBusy]);

  const copyDiagnosticsChecklist = React.useCallback(async () => {
    const lines: string[] = [];
    lines.push('Desktop Control MCP Diagnostics');
    lines.push('');

    for (const server of DESKTOP_CONTROL_MCP_SERVERS) {
      const status = statusMap[server.mcpName];
      const stateLabel = getServerStateLabel(status);
      const error = getServerError(status);
      lines.push(`${server.mcpName}: ${stateLabel}`);
      if (error) {
        lines.push(`  error: ${error}`);
      }
      lines.push(`  command: ${[server.command, ...server.args].join(' ')}`);
    }

    const copyResult = await copyTextToClipboard(lines.join('\n'));
    if (copyResult.ok) {
      toast.success('Diagnostics copied');
    } else {
      toast.error('Failed to copy diagnostics', {
        description: copyResult.error,
      });
    }
  }, [statusMap]);

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <RiComputerLine className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Desktop Control</h3>
          <p className="text-sm text-muted-foreground">Install and connect MCP servers for clickable desktop/browser automation.</p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        <RiInformationLine className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div className="space-y-1">
          <p>Desktop browser workflows are controlled from inside KronosChamber with split chat + browser view.</p>
          <p>Install the MCP preset below, then use MCP connect/disconnect toggles in the header dropdown as the live control source.</p>
        </div>
      </div>

      <div className="space-y-3">
        {DESKTOP_CONTROL_MCP_SERVERS.map((server) => {
          const installed = mcpServers.some((entry) => entry.name === server.mcpName);
          const status = statusMap[server.mcpName];
          const connected = (status as { status?: string } | undefined)?.status === 'connected';
          return (
            <DesktopControlServerCard
              key={server.id}
              server={server}
              installed={installed}
              connected={connected}
              statusLabel={getServerStateLabel(status)}
              statusError={getServerError(status)}
              envValues={envByServer[server.id] ?? {}}
              busyAction={busyByServer[server.id] ?? null}
              onChangeEnv={(key, value) => updateEnvValue(server.id, key, value)}
              onInstall={() => void installServer(server)}
              onRemove={() => void removeServer(server)}
              onToggleConnection={() => void toggleConnection(server, connected)}
            />
          );
        })}
      </div>

      <details className="rounded-xl border border-border/60 bg-card/40 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-foreground">MCP Connection Diagnostics</summary>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          {DESKTOP_CONTROL_MCP_SERVERS.map((server) => {
            const status = statusMap[server.mcpName];
            const error = getServerError(status);
            return (
              <div key={`diag-${server.id}`} className="rounded-md border border-border/50 bg-background/60 p-2">
                <div className="font-medium text-foreground">{server.mcpName}</div>
                <div>status: {getServerStateLabel(status)}</div>
                {error ? <div className="text-status-error">error: {error}</div> : null}
                <div className="truncate">command: {[server.command, ...server.args].join(' ')}</div>
              </div>
            );
          })}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void copyDiagnosticsChecklist()}>
            <RiCheckLine className="h-4 w-4" />
            Copy diagnostics
          </Button>
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={() => setSidebarSection('mcp')}>
          <RiSettings4Line className="h-4 w-4" />
          Open MCP Settings
        </Button>
      </div>
    </div>
  );
}

export default DesktopControlSettings;
