import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import {
  RiArrowLeftLine,
  RiExternalLinkLine,
  RiLinkM,
  RiErrorWarningLine,
} from '@remixicon/react';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUIStore } from '@/stores/useUIStore';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RuntimeContextPanelProps {
  directory: string;
  taskID: string;
}

type RuntimeTab = 'live' | 'files' | 'logs';

type RuntimeArtifact = {
  name?: string;
  path?: string;
  url?: string;
};

type RuntimeTask = {
  taskID: string;
  agentName?: string;
  liveUrl?: string;
  artifacts?: RuntimeArtifact[];
  logs?: string[];
};

const RuntimeContextPanel: React.FC<RuntimeContextPanelProps> = ({ directory, taskID }) => {
  const { agentModeTasks } = useSessionStore(
    useShallow((state) => ({
      agentModeTasks: (state as { agentModeTasks?: Map<string, RuntimeTask[]> }).agentModeTasks,
    }))
  );
  const { closeContextPanel } = useUIStore();

  const currentTask = useMemo<RuntimeTask | null>(() => {
    const tasksByDirectory = agentModeTasks ?? new Map<string, RuntimeTask[]>();
    const tasks = tasksByDirectory.get(directory);
    return tasks?.find((task) => task.taskID === taskID) ?? null;
  }, [agentModeTasks, directory, taskID]);

  const [activeTab, setActiveTab] = useState<RuntimeTab>('live');

  useEffect(() => {
    if (currentTask?.liveUrl && activeTab !== 'live') {
      setActiveTab('live');
      return;
    }

    if (!currentTask?.liveUrl && activeTab === 'live') {
      setActiveTab('logs');
    }
  }, [currentTask?.liveUrl, activeTab]);

  const handleOpenLiveUrl = useCallback(() => {
    if (currentTask?.liveUrl) {
      window.open(currentTask.liveUrl, '_blank', 'noopener,noreferrer');
    }
  }, [currentTask?.liveUrl]);

  if (!currentTask) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <RiErrorWarningLine className="mb-2 h-10 w-10" />
        <p>Runtime task not found.</p>
        <Button variant="ghost" onClick={() => closeContextPanel(directory)}>
          <RiArrowLeftLine className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex items-center justify-between border-b p-2">
        <Button variant="ghost" size="sm" onClick={() => closeContextPanel(directory)}>
          <RiArrowLeftLine className="mr-2 h-4 w-4" /> Back
        </Button>
        <span className="truncate text-sm font-medium">{currentTask.agentName || 'Runtime Task'}</span>
        <div className="flex items-center gap-1">
          {currentTask.liveUrl ? (
            <Button variant="ghost" size="sm" onClick={handleOpenLiveUrl} title="Open Live URL Externally">
              <RiExternalLinkLine className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 p-2">
        <Button
          size="sm"
          variant={activeTab === 'live' ? 'default' : 'outline'}
          disabled={!currentTask.liveUrl}
          onClick={() => setActiveTab('live')}
        >
          Live
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'files' ? 'default' : 'outline'}
          onClick={() => setActiveTab('files')}
        >
          Files
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'logs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </Button>
      </div>
      <Separator />

      <div className="flex-1 p-2">
        {activeTab === 'live' ? (
          currentTask.liveUrl ? (
            <iframe src={currentTask.liveUrl} className="h-full w-full rounded-md border-none" title="Runtime Live View" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No live URL available.</div>
          )
        ) : null}

        {activeTab === 'files' ? (
          <ScrollArea className="h-full">
            {currentTask.artifacts && currentTask.artifacts.length > 0 ? (
              <ul className="space-y-2">
                {currentTask.artifacts.map((artifact, index) => (
                  <li key={`${artifact.path || artifact.url || artifact.name || 'artifact'}-${index}`} className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                    <RiLinkM className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate font-mono">{artifact.name || artifact.path || artifact.url || 'artifact'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No artifacts found.</div>
            )}
          </ScrollArea>
        ) : null}

        {activeTab === 'logs' ? (
          <ScrollArea className="h-full">
            {currentTask.logs && currentTask.logs.length > 0 ? (
              <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs leading-relaxed text-foreground">
                {currentTask.logs.join('\n')}
              </pre>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No logs available.</div>
            )}
          </ScrollArea>
        ) : null}
      </div>
    </div>
  );
};

export { RuntimeContextPanel };
export default RuntimeContextPanel;
