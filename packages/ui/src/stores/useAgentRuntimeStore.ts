import { create } from 'zustand';
import { runtimeSdk, type RuntimeTask } from '@/lib/runtimeSdk';

type AgentTaskStatus = 'queued' | 'running' | 'done';

export type AgentRuntimeTask = RuntimeTask;

type AgentRuntimeStore = {
  sessionID: string | null;
  tasksByID: Record<string, AgentRuntimeTask>;
  orderedTaskIDs: string[];
  isHydrating: boolean;
  error: string | null;
  lastHydratedAt: number | null;
  bindSession: (sessionID: string | null) => Promise<void>;
  hydrate: (sessionID?: string | null) => Promise<void>;
  upsertTask: (task: Partial<RuntimeTask> & { taskID: string }) => void;
  ingestTaskEvent: (payload: unknown) => void;
  clear: () => void;
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTask = (
  input: Partial<RuntimeTask> & { taskID: string },
): AgentRuntimeTask => {
  const rawStatus = input.status === 'queued' || input.status === 'running' || input.status === 'done'
    ? input.status
    : 'queued';
  
  const mode = (input.mode === 'e2b' || input.mode === 'openbrowser' || input.mode === 'desktop-browser') 
    ? input.mode 
    : 'openbrowser';

  const logs = Array.isArray(input.logs)
    ? input.logs.filter((line): line is string => typeof line === 'string' && line.trim().length > 0)
    : [];

  const artifacts = Array.isArray(input.artifacts)
    ? input.artifacts
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry, index) => {
        const artifact = entry as Record<string, unknown>;
        return {
          id: typeof artifact.id === 'string' && artifact.id.trim().length > 0
            ? artifact.id.trim()
            : `artifact-${index}`,
          name: normalizeOptionalString(artifact.name),
          path: normalizeOptionalString(artifact.path),
          url: normalizeOptionalString(artifact.url),
          mimeType: normalizeOptionalString(artifact.mimeType),
          size: typeof artifact.size === 'number' && Number.isFinite(artifact.size) ? artifact.size : null,
        };
      })
    : [];

  return {
    ...input,
    taskID: input.taskID,
    mode,
    status: rawStatus,
    success: typeof input.success === 'boolean' ? input.success : null,
    prompt: typeof input.prompt === 'string' ? input.prompt : '',
    sessionID: normalizeOptionalString(input.sessionID) ?? null,
    error: typeof input.error === 'string' ? input.error : null,
    logs,
    artifacts,
    liveUrl: normalizeOptionalString(input.liveUrl),
    runtimeSessionID: normalizeOptionalString(input.runtimeSessionID),
    updatedAt: typeof input.updatedAt === 'number' ? input.updatedAt : Date.now(),
  } as AgentRuntimeTask;
};

const sortTaskIDs = (tasksByID: Record<string, AgentRuntimeTask>): string[] => {
  return Object.values(tasksByID)
    .sort((a, b) => {
      const priority = (status: AgentTaskStatus): number => {
        if (status === 'running') return 0;
        if (status === 'queued') return 1;
        return 2;
      };
      const priorityDiff = priority(a.status) - priority(b.status);
      if (priorityDiff !== 0) return priorityDiff;
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    })
    .map((task) => task.taskID);
};

export const useAgentRuntimeStore = create<AgentRuntimeStore>((set, get) => ({
  sessionID: null,
  tasksByID: {},
  orderedTaskIDs: [],
  isHydrating: false,
  error: null,
  lastHydratedAt: null,

  bindSession: async (sessionID) => {
    const normalized = normalizeOptionalString(sessionID) ?? null;
    if (get().sessionID === normalized) {
      return;
    }
    set({ sessionID: normalized, error: null });
    await get().hydrate(normalized);
  },

  hydrate: async (sessionID) => {
    const targetSessionID = normalizeOptionalString(sessionID ?? get().sessionID) ?? null;
    set({ isHydrating: true, error: null });
    try {
      const tasks = await runtimeSdk.listTasks({
        sessionID: targetSessionID ?? undefined,
        limit: 80,
      });
      set((state) => {
        const nextTasksByID = { ...state.tasksByID };
        for (const task of tasks) {
          const normalized = normalizeTask(task);
          nextTasksByID[normalized.taskID] = normalized;
        }
        return {
          tasksByID: nextTasksByID,
          orderedTaskIDs: sortTaskIDs(nextTasksByID),
          isHydrating: false,
          error: null,
          lastHydratedAt: Date.now(),
        };
      });
    } catch (error) {
      set({
        isHydrating: false,
        error: error instanceof Error ? error.message : 'Failed to hydrate runtime tasks',
      });
    }
  },

  upsertTask: (task) => {
    if (!task?.taskID) return;
    set((state) => {
      const current = state.tasksByID[task.taskID];
      const merged = normalizeTask({
        ...(current ?? { taskID: task.taskID }),
        ...task,
      } as any);
      const nextTasksByID = {
        ...state.tasksByID,
        [merged.taskID]: merged,
      };
      return {
        tasksByID: nextTasksByID,
        orderedTaskIDs: sortTaskIDs(nextTasksByID),
      };
    });
  },

  ingestTaskEvent: (payload) => {
    if (!payload || typeof payload !== 'object') return;
    const payloadRecord = payload as Record<string, unknown>;
    const taskCandidate =
      payloadRecord.task && typeof payloadRecord.task === 'object'
        ? (payloadRecord.task as Record<string, unknown>)
        : payloadRecord;

    const taskID = normalizeOptionalString(taskCandidate.taskID);
    if (!taskID) return;

    get().upsertTask({
      ...(taskCandidate as Partial<RuntimeTask>),
      taskID,
    });
  },

  clear: () => {
    set({
      sessionID: null,
      tasksByID: {},
      orderedTaskIDs: [],
      isHydrating: false,
      error: null,
      lastHydratedAt: null,
    });
  },
}));
