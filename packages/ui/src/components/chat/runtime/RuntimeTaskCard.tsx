import React from 'react';
import {
  RiExternalLinkLine,
  RiLoader4Line,
  RiComputerLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiTimeLine,
  RiGlobalLine,
  RiFileCopyLine,
} from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentRuntimeTask } from '@/stores/useAgentRuntimeStore';
import { useSessionStore } from '@/stores/useSessionStore';

type RuntimeTaskCardProps = {
  task: AgentRuntimeTask;
};

const formatMode = (mode: AgentRuntimeTask['mode']): string => {
  if (mode === 'e2b') return 'E2B Desktop';
  return 'OpenBrowser';
};

const formatStatus = (task: AgentRuntimeTask): string => {
  if (task.status === 'running') return 'Running';
  if (task.status === 'queued') return 'Queued';
  if (task.success === true) return 'Completed';
  if (task.success === false) return 'Failed';
  return 'Done';
};

const statusTone = (task: AgentRuntimeTask): 'info' | 'success' | 'error' | 'neutral' => {
  if (task.status === 'running' || task.status === 'queued') return 'info';
  if (task.success === true) return 'success';
  if (task.success === false) return 'error';
  return 'neutral';
};

const deriveFailureTriageHint = (task: AgentRuntimeTask): string | null => {
  if (task.status !== 'done' || task.success !== false) {
    return null;
  }

  const combined = `${task.error ?? ''}\n${Array.isArray(task.logs) ? task.logs.join('\n') : ''}`.toLowerCase();
  if (!combined.trim()) {
    return 'Retry this task, then inspect connector logs for the exact failing step.';
  }

  if (combined.includes('command not found') || combined.includes('enoent') || combined.includes('not recognized as an internal')) {
    return 'Connector command is missing. Install/configure the CLI connector or switch to API connector mode.';
  }
  if (combined.includes('unauthorized') || combined.includes('forbidden') || combined.includes('401') || combined.includes('403') || combined.includes('api key') || combined.includes('token')) {
    return 'Connector credentials look invalid or missing. Re-check API key/token configuration and retry.';
  }
  if (combined.includes('timeout') || combined.includes('timed out') || combined.includes('econn') || combined.includes('network') || combined.includes('dns')) {
    return 'Network/connectivity issue detected. Retry, then switch runtime or connector if the issue persists.';
  }
  if (combined.includes('captcha') || combined.includes('challenge') || combined.includes('bot detection')) {
    return 'The target likely triggered anti-bot checks. Use manual takeover or adjust the task flow.';
  }
  if (combined.includes('selector') || combined.includes('element not found') || combined.includes('no such element')) {
    return 'Page structure drift detected. Retry with updated interaction steps or capture a fresh snapshot first.';
  }

  return 'Task failed. Clone and retry with tighter instructions, then check connector/runtime logs.';
};

export const RuntimeTaskCard: React.FC<RuntimeTaskCardProps> = ({ task }) => {
  const tone = statusTone(task);
  const canOpenLive = typeof task.liveUrl === 'string' && task.liveUrl.trim().length > 0;
  const latestLog = task.logs.length > 0 ? task.logs[task.logs.length - 1] : null;
  const setPendingInputText = useSessionStore((state) => state.setPendingInputText);
  const triageHint = React.useMemo(() => deriveFailureTriageHint(task), [task]);

  const handleOpenLive = React.useCallback(() => {
    if (!canOpenLive || !task.liveUrl) return;
    window.open(task.liveUrl, '_blank', 'noopener,noreferrer');
  }, [canOpenLive, task.liveUrl]);

  const handleCloneTask = React.useCallback(() => {
    const prompt = typeof task.prompt === 'string' ? task.prompt.trim() : '';
    const command = prompt.length > 0
      ? `/desktoptask ${task.mode} ${prompt}`
      : `/desktoptask ${task.mode} `;
    setPendingInputText(command, 'replace');
  }, [setPendingInputText, task.mode, task.prompt]);

  return (
    <div
      className={cn(
        'my-3 rounded-xl border p-3 backdrop-blur-sm',
        tone === 'info' && 'border-primary/40 bg-primary/5',
        tone === 'success' && 'border-status-success/40 bg-status-success/5',
        tone === 'error' && 'border-status-error/40 bg-status-error/5',
        tone === 'neutral' && 'border-border/70 bg-card/60'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <RiComputerLine className="h-4 w-4 text-foreground/80" />
            <p className="typography-ui-label truncate font-medium text-foreground">
              {formatMode(task.mode)} Task
            </p>
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {task.taskID.slice(0, 8)}
            </span>
          </div>
          <p className="typography-micro mt-1 text-muted-foreground">{task.prompt || 'Runtime task'}</p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[11px] font-medium">
          {task.status === 'running' && <RiLoader4Line className="h-3.5 w-3.5 animate-spin text-primary" />}
          {task.status === 'queued' && <RiTimeLine className="h-3.5 w-3.5 text-primary" />}
          {task.status === 'done' && task.success === true && <RiCheckboxCircleLine className="h-3.5 w-3.5 text-status-success" />}
          {task.status === 'done' && task.success === false && <RiErrorWarningLine className="h-3.5 w-3.5 text-status-error" />}
          <span className="text-foreground">{formatStatus(task)}</span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {task.runtimeSessionID ? (
          <span className="rounded-md border border-border/60 px-2 py-0.5">
            Session {task.runtimeSessionID}
          </span>
        ) : null}
        {task.connector?.kind ? (
          <span className="rounded-md border border-border/60 px-2 py-0.5">
            {task.connector.kind === 'api' ? 'API connector' : 'CLI connector'}
          </span>
        ) : null}
      </div>

      {latestLog ? (
        <div className="mt-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5">
          <p className="line-clamp-3 break-words font-mono text-[11px] text-muted-foreground">{latestLog}</p>
        </div>
      ) : null}

      {task.error ? (
        <div className="mt-2 rounded-md border border-status-error/30 bg-status-error/5 px-2 py-1.5 text-[11px] text-status-error">
          {task.error}
        </div>
      ) : null}

      {triageHint ? (
        <div className="mt-2 rounded-md border border-[var(--status-warning-border)] bg-[var(--status-warning-background)] px-2 py-1.5 text-[11px] text-[var(--status-warning)]">
          {triageHint}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleCloneTask}>
          <RiFileCopyLine className="h-3.5 w-3.5" />
          Clone task
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={handleOpenLive}
          disabled={!canOpenLive}
        >
          <RiGlobalLine className="h-3.5 w-3.5" />
          Open live
          <RiExternalLinkLine className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
