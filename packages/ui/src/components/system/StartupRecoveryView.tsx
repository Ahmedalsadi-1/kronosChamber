import React from 'react';
import { RiFileCopyLine, RiFolderOpenLine, RiRefreshLine, RiErrorWarningLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export type StartupRecoveryError = {
  message: string;
  name?: string;
  stack?: string;
  source?: string;
  timestamp: string;
};

interface StartupRecoveryViewProps {
  error: StartupRecoveryError;
  onRetry: () => void;
  onCopyDiagnostics: () => Promise<void> | void;
  onOpenLogs: () => Promise<void> | void;
}

export const StartupRecoveryView: React.FC<StartupRecoveryViewProps> = ({
  error,
  onRetry,
  onCopyDiagnostics,
  onOpenLogs,
}) => {
  const [isCopying, setIsCopying] = React.useState(false);
  const [isOpeningLogs, setIsOpeningLogs] = React.useState(false);
  const [copyState, setCopyState] = React.useState<'idle' | 'done' | 'failed'>('idle');
  const [openLogsState, setOpenLogsState] = React.useState<'idle' | 'done' | 'failed'>('idle');

  const handleCopy = React.useCallback(async () => {
    if (isCopying) {
      return;
    }
    setIsCopying(true);
    setCopyState('idle');
    try {
      await onCopyDiagnostics();
      setCopyState('done');
    } catch {
      setCopyState('failed');
    } finally {
      setIsCopying(false);
    }
  }, [isCopying, onCopyDiagnostics]);

  const handleOpenLogs = React.useCallback(async () => {
    if (isOpeningLogs) {
      return;
    }
    setIsOpeningLogs(true);
    setOpenLogsState('idle');
    try {
      await onOpenLogs();
      setOpenLogsState('done');
    } catch {
      setOpenLogsState('failed');
    } finally {
      setIsOpeningLogs(false);
    }
  }, [isOpeningLogs, onOpenLogs]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(120% 120% at 90% 10%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 65%), radial-gradient(120% 120% at 10% 90%, color-mix(in oklab, var(--status-warning) 18%, transparent), transparent 62%)',
        }}
      />
      <Card className="relative z-10 w-full max-w-xl border-border/70 bg-card/95 shadow-lg backdrop-blur-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 typography-h4">
            <RiErrorWarningLine className="h-5 w-5 text-destructive" />
            Startup failed
          </CardTitle>
          <CardDescription>
            KronosChamber hit a fatal bootstrap error. Retry startup or capture diagnostics before retrying.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="typography-ui-label text-foreground/90">
              {error.name ? `${error.name}: ` : ''}
              {error.message}
            </p>
            {error.source ? (
              <p className="mt-1 typography-meta text-muted-foreground">Source: {error.source}</p>
            ) : null}
            <p className="typography-meta text-muted-foreground">Time: {error.timestamp}</p>
          </div>

          {error.stack ? (
            <details className="rounded-lg border border-border/70 bg-muted/25 p-3">
              <summary className="cursor-pointer typography-meta text-muted-foreground hover:text-foreground">
                Stack trace
              </summary>
              <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words typography-micro text-muted-foreground">
                {error.stack}
              </pre>
            </details>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onRetry} size="sm">
              <RiRefreshLine className="h-4 w-4" />
              Retry
            </Button>
            <Button onClick={handleCopy} variant="outline" size="sm" disabled={isCopying}>
              <RiFileCopyLine className="h-4 w-4" />
              {copyState === 'done' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy diagnostics'}
            </Button>
            <Button onClick={handleOpenLogs} variant="outline" size="sm" disabled={isOpeningLogs}>
              <RiFolderOpenLine className="h-4 w-4" />
              {openLogsState === 'done' ? 'Opened logs' : openLogsState === 'failed' ? 'Open failed' : 'Open logs path'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
