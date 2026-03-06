import type { DesktopAgentMode } from '@/lib/desktop';
import { runtimeSdk, type RuntimeTask, type RuntimeStatus } from './runtimeSdk';

export type DesktopAgentTaskRequest = {
  prompt: string;
  mode?: Exclude<DesktopAgentMode, 'off'>;
  background?: boolean;
  sessionID?: string | null;
  providerID?: string | null;
  modelID?: string | null;
  agentName?: string | null;
};

export type DesktopAgentTaskResponse = RuntimeTask;

export type DesktopAgentModeStatus = RuntimeStatus & {
  openCodeRunning?: boolean;
  openCodeSecureConnection?: boolean;
};

const normalizeAgentMode = (value: unknown): DesktopAgentMode => {
  if (value === 'e2b' || value === 'openbrowser' || value === 'desktop-browser' || value === 'off') {
    return value as DesktopAgentMode;
  }
  return 'off';
};

export const getDesktopAgentModeStatus = async (): Promise<DesktopAgentModeStatus> => {
  const status = await runtimeSdk.getStatus();
  return {
    ...status,
    mode: normalizeAgentMode(status.mode),
    availableModes: status.availableModes.map(normalizeAgentMode),
  } as DesktopAgentModeStatus;
};

export const updateDesktopAgentMode = async (mode: DesktopAgentMode): Promise<DesktopAgentModeStatus> => {
  // Use legacy endpoint for setting mode if not in SDK yet
  const response = await fetch('/api/agent-mode', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ mode }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update agent mode: ${response.status}`);
  }

  return response.json();
};

export const runDesktopAgentTask = async (request: DesktopAgentTaskRequest): Promise<DesktopAgentTaskResponse> => {
  return runtimeSdk.createTask({
    prompt: request.prompt,
    mode: request.mode as any,
    background: request.background,
    sessionID: request.sessionID ?? undefined,
    providerID: request.providerID ?? undefined,
    modelID: request.modelID ?? undefined,
    agentName: request.agentName ?? undefined,
  });
};

export const listDesktopAgentTasks = async (
  options?: { sessionID?: string | null; limit?: number; mode?: Exclude<DesktopAgentMode, 'off'> | null }
): Promise<DesktopAgentTaskResponse[]> => {
  return runtimeSdk.listTasks({
    sessionID: options?.sessionID ?? undefined,
    limit: options?.limit,
    mode: options?.mode as any,
  });
};
