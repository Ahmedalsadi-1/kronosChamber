import type { BrowserRuntimeAction, BrowserRuntimeActionPayload } from "./kronoscode/client";

export type { BrowserRuntimeAction, BrowserRuntimeActionPayload };

export type RuntimeBrowserActionRequest = {
  action: string;
  payload: any;
};

export type RuntimeMode = 'off' | 'e2b' | 'openbrowser' | 'desktop-browser';

export type RuntimeTaskStatus = 'queued' | 'running' | 'done';

export type RuntimeTask = {
  taskID: string;
  mode: Exclude<RuntimeMode, 'off'>;
  status: RuntimeTaskStatus;
  success: boolean | null;
  prompt: string;
  sessionID: string | null;
  providerID: string | null;
  modelID: string | null;
  agentName: string | null;
  connector: {
    mode: Exclude<RuntimeMode, 'off'>;
    kind: 'api' | 'command' | 'desktop';
    endpoint?: string | null;
    command?: string | null;
  } | null;
  runtimeSessionID: string | null;
  liveUrl: string | null;
  artifacts: Array<{
    id: string | null;
    name: string | null;
    path: string | null;
    url: string | null;
    mimeType: string | null;
    size: number | null;
  }>;
  logs: string[];
  error: string | null;
  result: unknown;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  updatedAt: number;
};

export type RuntimeStatus = {
  mode: RuntimeMode;
  availableModes: RuntimeMode[];
  timestamp: number;
  connectors: Record<string, {
    available: boolean;
    provider: string;
    error?: string;
  }>;
  tasks: {
    total: number;
    running: number;
  };
};

export type RuntimeTaskRequest = {
  prompt: string;
  mode?: Exclude<RuntimeMode, 'off'>;
  background?: boolean;
  sessionID?: string;
  providerID?: string;
  modelID?: string;
  agentName?: string;
};

export class RuntimeSdk {
  private static instance: RuntimeSdk;
  
  private constructor() {}

  static getInstance(): RuntimeSdk {
    if (!RuntimeSdk.instance) {
      RuntimeSdk.instance = new RuntimeSdk();
    }
    return RuntimeSdk.instance;
  }

  getStatus = async (): Promise<RuntimeStatus> => {
    const response = await fetch('/api/runtime/status', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Failed to fetch runtime status: ${response.status}`);
    return response.json();
  };

  createTask = async (request: RuntimeTaskRequest): Promise<RuntimeTask> => {
    const response = await fetch('/api/runtime/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create runtime task: ${response.status}`);
    return response.json();
  };

  listTasks = async (options?: { sessionID?: string; mode?: RuntimeMode; limit?: number }): Promise<RuntimeTask[]> => {
    const query = new URLSearchParams();
    if (options?.sessionID) query.set('sessionID', options.sessionID);
    if (options?.mode) query.set('mode', options.mode);
    if (options?.limit) query.set('limit', String(options.limit));

    const url = query.size > 0 ? `/api/runtime/tasks?${query.toString()}` : '/api/runtime/tasks';
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Failed to list runtime tasks: ${response.status}`);
    const data = await response.json();
    return data.tasks || [];
  };

  getTask = async (taskID: string): Promise<RuntimeTask> => {
    const response = await fetch(`/api/runtime/task/${encodeURIComponent(taskID)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Failed to fetch task ${taskID}: ${response.status}`);
    return response.json();
  };

  runBrowserAction = async <TAction extends BrowserRuntimeAction>(
    sessionID: string,
    action: TAction,
    payload?: BrowserRuntimeActionPayload<TAction>
  ): Promise<unknown> => {
    const response = await fetch(`/api/runtime/browser/action?sessionID=${encodeURIComponent(sessionID)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ sessionID, action, payload: payload ?? {} }),
    });
    if (!response.ok) throw new Error(`Browser action failed: ${response.status}`);
    return response.json();
  };

  getBrowserState = async (sessionID: string): Promise<any> => {
    const response = await fetch(`/api/runtime/browser/state?sessionID=${encodeURIComponent(sessionID)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Failed to fetch browser state: ${response.status}`);
    return response.json();
  };

  getBrowserFrame = async (sessionID: string, frameId?: string): Promise<any> => {
    const url = frameId 
      ? `/api/runtime/browser/frame?sessionID=${encodeURIComponent(sessionID)}&frameId=${encodeURIComponent(frameId)}`
      : `/api/runtime/browser/frame?sessionID=${encodeURIComponent(sessionID)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Failed to fetch browser frame: ${response.status}`);
    return response.json();
  };
}

const runtimeSdkInstance = RuntimeSdk.getInstance();

export const runtimeSdk = runtimeSdkInstance;
export const getBrowserState = runtimeSdkInstance.getBrowserState;
export const getBrowserFrame = runtimeSdkInstance.getBrowserFrame;
export const runBrowserAction = runtimeSdkInstance.runBrowserAction;
export const listRuntimeTasks = runtimeSdkInstance.listTasks;
export const createRuntimeTask = runtimeSdkInstance.createTask;
export const getRuntimeStatus = runtimeSdkInstance.getStatus;
export const getRuntimeTask = runtimeSdkInstance.getTask;
