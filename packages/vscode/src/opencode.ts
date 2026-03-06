import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import { execSync } from 'child_process';
import { spawnSync } from 'child_process';
import { spawn } from 'child_process';
import { randomBytes } from 'crypto';

const READY_CHECK_TIMEOUT_MS = 30000;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type KronosCodeDebugInfo = {
  mode: 'managed' | 'external';
  status: ConnectionStatus;
  lastError?: string;
  workingDirectory: string;
  cliAvailable: boolean;
  cliPath: string | null;
  configuredApiUrl: string | null;
  configuredPort: number | null;
  detectedPort: number | null;
  apiPrefix: string;
  apiPrefixDetected: boolean;
  startCount: number;
  restartCount: number;
  lastStartAt: number | null;
  lastConnectedAt: number | null;
  lastExitCode: number | null;
  serverUrl: string | null;
  lastReadyElapsedMs: number | null;
  lastReadyAttempts: number | null;
  lastStartAttempts: number | null;
  version: string | null;
  secureConnection: boolean;
  authSource: 'user-env' | 'generated' | 'rotated' | null;
};

export interface KronosCodeManager {
  start(workdir?: string): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  setWorkingDirectory(path: string): Promise<{ success: boolean; restarted: boolean; path: string }>;
  getStatus(): ConnectionStatus;
  getApiUrl(): string | null;
  getKronosCodeAuthHeaders(): Record<string, string>;
  getWorkingDirectory(): string;
  isCliAvailable(): boolean;
  getDebugInfo(): KronosCodeDebugInfo;
  onStatusChange(callback: (status: ConnectionStatus, error?: string) => void): vscode.Disposable;
}

function generateSecureKronosCodePassword(): string {
  return randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildKronosCodeAuthHeader(password: string): string {
  return `Basic ${Buffer.from(`kronoscode:${password}`, 'utf8').toString('base64')}`;
}

function isValidKronosCodePassword(password: string): boolean {
  return typeof password === 'string' && password.trim().length > 0;
}

function readKronosChamberSettings(): Record<string, unknown> {
  const settingsPath = path.join(os.homedir(), '.config', 'openchamber', 'settings.json');
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function resolvePortFromUrl(url: string): number | null {
  try {
    const parsed = new URL(url);
    return parsed.port ? parseInt(parsed.port, 10) : null;
  } catch {
    return null;
  }
}

function isExecutable(filePath: string): boolean {
  if (!filePath) return false;
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    // Windows executability is extension-based.
    if (process.platform === 'win32') {
      const ext = path.extname(filePath).toLowerCase();
      if (!ext) return true;
      return ['.exe', '.cmd', '.bat', '.com'].includes(ext);
    }
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function appendToPath(dir: string) {
  const trimmed = (dir || '').trim();
  if (!trimmed) return;
  const current = process.env.PATH || '';
  const parts = current.split(path.delimiter).filter(Boolean);
  if (parts.includes(trimmed)) return;
  process.env.PATH = [trimmed, ...parts].join(path.delimiter);
}

function resolveOpencodeCliPath(): string | null {
  const configured = (() => {
    try {
      const config = vscode.workspace.getConfiguration('openchamber');
      const raw = config.get<string>('kronoscodeBinary') || '';
      const trimmed = raw.trim();
      if (!trimmed) return null;
      try {
        const stat = fs.statSync(trimmed);
        if (stat.isDirectory()) {
          return path.join(trimmed, process.platform === 'win32' ? 'kronoscode.exe' : 'kronoscode');
        }
      } catch {
        // ignore
      }
      return trimmed;
    } catch {
      return null;
    }
  })();

  if (configured && isExecutable(configured)) {
    return configured;
  }

  const sharedFromKronosChamber = (() => {
    try {
      const settings = readKronosChamberSettings();
      const candidate = settings.kronoscodeBinary;
      if (typeof candidate !== 'string') {
        return null;
      }
      const trimmed = candidate.trim();
      return trimmed.length > 0 ? trimmed : null;
    } catch {
      return null;
    }
  })();

  if (sharedFromKronosChamber && isExecutable(sharedFromKronosChamber)) {
    return sharedFromKronosChamber;
  }

  const explicit = [
    process.env.KRONOSCODE_BINARY,
    process.env.KRONOSCODE_PATH,
    process.env.KRONOSCHAMBER_KRONOSCODE_PATH,
    process.env.KRONOSCHAMBER_KRONOSCODE_BIN,
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);

  for (const candidate of explicit) {
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  const home = os.homedir();
  const unixFallbacks = [
    path.join(home, '.kronoscode', 'bin', 'kronoscode'),
    path.join(home, '.bun', 'bin', 'kronoscode'),
    path.join(home, '.local', 'bin', 'kronoscode'),
    path.join(home, 'bin', 'kronoscode'),
  ];

  const winFallbacks = (() => {
    const userProfile = process.env.USERPROFILE || home;
    const appData = process.env.APPDATA || '';
    const localAppData = process.env.LOCALAPPDATA || '';
    const programData = process.env.ProgramData || 'C:\\ProgramData';

    return [
      path.join(userProfile, '.kronoscode', 'bin', 'kronoscode.exe'),
      path.join(userProfile, '.kronoscode', 'bin', 'kronoscode.cmd'),
      path.join(appData, 'npm', 'kronoscode.cmd'),
      path.join(userProfile, 'scoop', 'shims', 'kronoscode.cmd'),
      path.join(programData, 'chocolatey', 'bin', 'kronoscode.exe'),
      path.join(programData, 'chocolatey', 'bin', 'kronoscode.cmd'),
      // Bun global install
      path.join(userProfile, '.bun', 'bin', 'kronoscode.exe'),
      path.join(userProfile, '.bun', 'bin', 'kronoscode.cmd'),
      // Some installers use LocalAppData
      localAppData ? path.join(localAppData, 'Programs', 'kronoscode', 'kronoscode.exe') : '',
    ].filter(Boolean);
  })();

  const fallbacks = process.platform === 'win32' ? winFallbacks : unixFallbacks;
  for (const candidate of fallbacks) {
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  if (process.platform === 'win32') {
    try {
      const result = spawnSync('where', ['kronoscode'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (result.status === 0) {
        const lines = (result.stdout || '')
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        const found = lines.find((line) => isExecutable(line));
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return null;
  }

  // Non-Windows: try a login shell PATH lookup.
  const shells = [process.env.SHELL, '/bin/zsh', '/bin/bash', '/bin/sh'].filter(Boolean) as string[];
  for (const shell of shells) {
    if (!isExecutable(shell)) continue;
    try {
      const result = spawnSync(shell, ['-lic', 'command -v kronoscode'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (result.status === 0) {
        const found = (result.stdout || '').trim().split(/\s+/).pop() || '';
        if (found && isExecutable(found)) {
          return found;
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

type ReadyResult =
  | { ok: true; baseUrl: string; elapsedMs: number; attempts: number; version: string | null }
  | { ok: false; elapsedMs: number; attempts: number; version: null };

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function getCandidateBaseUrls(serverUrl: string): string[] {
  const normalized = normalizeBaseUrl(serverUrl);
  try {
    const parsed = new URL(normalized);
    const origin = parsed.origin;

    const candidates: string[] = [];
    const add = (url: string) => {
      const v = normalizeBaseUrl(url);
      if (!candidates.includes(v)) candidates.push(v);
    };

    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    // Prefer plain origin. Only keep SDK url when already root.
    add(origin);
    if (normalizedPath === '' || normalizedPath === '/') {
      add(normalized);
    }

    return candidates;
  } catch {
    return [normalized];
  }
}

async function waitForReady(
  serverUrl: string,
  timeoutMs = 15000,
  authHeaders: Record<string, string> = {}
): Promise<ReadyResult> {
  const outputChannel = vscode.window.createOutputChannel('KronosChamberManager');
  const start = Date.now();
  const candidates = getCandidateBaseUrls(serverUrl);
  let attempts = 0;

  while (Date.now() - start < timeoutMs) {
    for (const baseUrl of candidates) {
      attempts += 1;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        // KronosCode readiness check.
        const url = new URL(`${baseUrl}/global/health`);
        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json', ...authHeaders },
          signal: controller.signal,
        });

        let body: { healthy?: boolean, version?: string } | null = null;
        try {
          body = (await res.json()) as { healthy?: boolean, version?: string };
        } catch {
          body = null;
        }

        clearTimeout(timeout);
        outputChannel?.appendLine(
          `Health check to ${url.toString()} returned ${res.status} with body: ${JSON.stringify(body)}`
        );

        if (res.ok && body?.healthy === true) {
          return { ok: true, baseUrl, elapsedMs: Date.now() - start, attempts, version: body?.version ?? null };
        }
      } catch {
        // ignore
      }
    }

    await new Promise(r => setTimeout(r, 100));
  }

  return { ok: false, elapsedMs: Date.now() - start, attempts, version: null };
}

async function spawnManagedKronosCodeServer(
  workingDirectory: string,
  port: number,
  timeoutMs: number
): Promise<{ url: string; close: () => void }> {
  const binary = (process.env.KRONOSCODE_BINARY || 'kronoscode').trim() || 'kronoscode';
  const args = ['serve', '--hostname', '127.0.0.1', '--port', String(port)];
  const child = spawn(binary, args, {
    cwd: workingDirectory,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const url = await new Promise<string>((resolve, reject) => {
    let output = '';
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdout?.off('data', onStdout);
      child.stderr?.off('data', onStderr);
      child.off('exit', onExit);
      child.off('error', onError);
    };

    const onStdout = (chunk: Buffer) => {
      output += chunk.toString();
      const lines = output.split('\n');
      for (const line of lines) {
        if (!line.startsWith('kronoscode server listening')) continue;
        const match = line.match(/on\s+(https?:\/\/[^\s]+)/);
        if (!match) {
          cleanup();
          reject(new Error(`Failed to parse server url from output: ${line}`));
          return;
        }
        cleanup();
        resolve(match[1]);
        return;
      }
    };

    const onStderr = (chunk: Buffer) => {
      output += chunk.toString();
    };

    const onExit = (code: number | null) => {
      cleanup();
      reject(new Error(`KronosCode exited with code ${code}. Output: ${output}`));
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for server to start after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.on('data', onStdout);
    child.stderr?.on('data', onStderr);
    child.on('exit', onExit);
    child.on('error', onError);
  });

  return {
    url,
    close: () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // ignore
      }
    },
  };
}

async function allocateManagedKronosCodePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error) => {
      reject(error);
    });

    server.once('listening', () => {
      const address = server.address();
      const port = address && typeof address === 'object' ? address.port : 0;
      server.close(() => {
        if (port > 0) {
          resolve(port);
          return;
        }
        reject(new Error('Failed to allocate KronosCode port'));
      });
    });

    server.listen(0, '127.0.0.1');
  });
}

export function createKronosCodeManager(_context: vscode.ExtensionContext): KronosCodeManager {
  void _context;
  let server: { url: string; close: () => void } | null = null;
  let managedApiUrlOverride: string | null = null;
  let managedPassword: string | null = null;
  let managedPasswordSource: 'user-env' | 'generated' | 'rotated' | null = null;
  const userProvidedEnvPassword = (() => {
    const normalized = (process.env.KRONOSCODE_SERVER_PASSWORD || '').trim();
    return isValidKronosCodePassword(normalized) ? normalized : null;
  })();
  let status: ConnectionStatus = 'disconnected';
  let lastError: string | undefined;
  const listeners = new Set<(status: ConnectionStatus, error?: string) => void>();
  const workspaceDirectory = (): string =>
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || os.homedir();
  let workingDirectory: string = workspaceDirectory();
  let startCount = 0;
  let restartCount = 0;
  let lastStartAt: number | null = null;
  let lastConnectedAt: number | null = null;
  let lastExitCode: number | null = null;
  let lastReadyElapsedMs: number | null = null;
  let lastReadyAttempts: number | null = null;
  let lastStartAttempts: number | null = null;
  let version: string | null = null;

  let detectedPort: number | null = null;
  let cliMissing = false;
  let cliPath: string | null = null;

  let pendingOperation: Promise<void> | null = null;

  const config = vscode.workspace.getConfiguration('openchamber');
  const configuredApiUrl = config.get<string>('apiUrl') || '';
  const useConfiguredUrl = configuredApiUrl && configuredApiUrl.trim().length > 0;

  let configuredPort: number | null = null;
  if (useConfiguredUrl) {
    try {
      const parsed = new URL(configuredApiUrl);
      if (parsed.port) {
        configuredPort = parseInt(parsed.port, 10);
      }
    } catch {
      // Invalid URL
    }
  }

  const setStatus = (newStatus: ConnectionStatus, error?: string) => {
    if (status !== newStatus || lastError !== error) {
      status = newStatus;
      lastError = error;
      if (newStatus === 'connected') {
        lastConnectedAt = Date.now();
      }
      listeners.forEach(cb => cb(status, error));
    }
  };

  const getApiUrl = (): string | null => {
    if (useConfiguredUrl && configuredApiUrl) {
      return configuredApiUrl.replace(/\/+$/, '');
    }
    if (managedApiUrlOverride) {
      return managedApiUrlOverride.replace(/\/+$/, '');
    }
    if (server?.url) {
      return server.url.replace(/\/+$/, '');
    }
    if (detectedPort) {
      return `http://127.0.0.1:${detectedPort}`;
    }
    return null;
  };

  const getKronosCodeAuthHeaders = (): Record<string, string> => {
    const password = (managedPassword || userProvidedEnvPassword || process.env.KRONOSCODE_SERVER_PASSWORD || '').trim();
    if (!password) {
      return {};
    }
    return { Authorization: buildKronosCodeAuthHeader(password) };
  };

  const setManagedPasswordState = (
    password: string,
    source: 'user-env' | 'generated' | 'rotated'
  ): string => {
    const normalized = password.trim();
    managedPassword = normalized;
    managedPasswordSource = source;
    process.env.KRONOSCODE_SERVER_PASSWORD = normalized;
    return normalized;
  };

  const ensureManagedKronosCodeServerPassword = async ({ rotateManaged = false }: { rotateManaged?: boolean } = {}): Promise<string> => {
    if (userProvidedEnvPassword) {
      return setManagedPasswordState(userProvidedEnvPassword, 'user-env');
    }

    if (rotateManaged) {
      return setManagedPasswordState(generateSecureKronosCodePassword(), 'rotated');
    }

    if (managedPassword && isValidKronosCodePassword(managedPassword)) {
      return setManagedPasswordState(
        managedPassword,
        managedPasswordSource || 'generated'
      );
    }

    return setManagedPasswordState(generateSecureKronosCodePassword(), 'generated');
  };

  async function startInternal(
    workdir?: string,
    options: { rotateManaged?: boolean } = {}
  ): Promise<void> {
    startCount += 1;
    setStatus('connecting');
    lastStartAt = Date.now();
    lastStartAttempts = startCount;

    if (typeof workdir === 'string' && workdir.trim().length > 0) {
      workingDirectory = workdir.trim();
    } else {
      workingDirectory = workspaceDirectory();
    }

    if (useConfiguredUrl && configuredApiUrl) {
      setStatus('connecting');
      setStatus('connected');
      return;
    }

    // If server already running, don't spawn another
    if (server) {
      if (status !== 'connected') {
        setStatus('connected');
      }
      return;
    }

    setStatus('connecting');
    cliMissing = false;
    cliPath = null;

    detectedPort = null;
    lastExitCode = null;
    managedApiUrlOverride = null;

    try {
      // Best-effort: locate CLI even when VS Code PATH is stale.
      const resolvedCli = resolveOpencodeCliPath();
      if (resolvedCli) {
        cliPath = resolvedCli;
        appendToPath(path.dirname(resolvedCli));
        process.env.KRONOSCODE_BINARY = resolvedCli;
      }

      const password = await ensureManagedKronosCodeServerPassword({
        rotateManaged: options.rotateManaged === true,
      });
      process.env.KRONOSCODE_SERVER_PASSWORD = password;

      // SDK spawns `kronoscode serve` in current process cwd.
      // Some KronosCode endpoints behave differently based on server process cwd,
      // so ensure we start it from the workspace directory.
      const originalCwd = process.cwd();
      try {
        process.chdir(workingDirectory);
        const port = await allocateManagedKronosCodePort();
        server = await spawnManagedKronosCodeServer(workingDirectory, port, READY_CHECK_TIMEOUT_MS);
      } finally {
        try {
          process.chdir(originalCwd);
        } catch {
          // ignore
        }
      }

      if (server && server.url) {
        // Validate readiness for the current workspace context.
        const ready = await waitForReady(server.url, READY_CHECK_TIMEOUT_MS, getKronosCodeAuthHeaders());
        lastReadyElapsedMs = ready.elapsedMs;
        lastReadyAttempts = ready.attempts;
        if (ready.ok) {
          managedApiUrlOverride = ready.baseUrl;
          detectedPort = resolvePortFromUrl(ready.baseUrl);
          version = ready.version;
          setStatus('connected');
        } else {
          try {
            server.close();
          } catch {
            // ignore
          }
          server = null;
          throw new Error('Server started but health check failed');
        }
      } else {
        throw new Error('Server started but URL is missing');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Check for ENOENT or generic spawn failure which implies CLI missing
      if (message.includes('ENOENT') || message.includes('spawn kronoscode')) {
        cliMissing = true;
        if (!cliPath) {
          cliPath = resolveOpencodeCliPath();
        }
        setStatus('error', 'KronosCode CLI not found. Install it and ensure it\'s in PATH.');
        vscode.window.showErrorMessage(
          'KronosCode CLI not found. Please install it and ensure it\'s in PATH.',
          'More Info'
        ).then(selection => {
          if (selection === 'More Info') {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/anomalyco/kronoscode'));
          }
        });
      } else {
        setStatus('error', `Failed to start KronosCode: ${message}`);
      }
    }
  }

  async function stopInternal(): Promise<void> {
    const portToKill = detectedPort;

    if (server) {
      try {
        server.close();
      } catch {
        // Ignore close errors
      }
      server = null;
    }

    // Kill any process listening on our port to clean up orphaned children.
    if (portToKill) {
      try {
        const lsofOutput = execSync(`lsof -ti:${portToKill} 2>/dev/null || true`, {
          encoding: 'utf8',
          timeout: 5000
        });
        const myPid = process.pid;
        for (const pidStr of lsofOutput.split(/\s+/)) {
          const pid = parseInt(pidStr.trim(), 10);
          if (pid && pid !== myPid) {
            try {
              execSync(`kill -9 ${pid} 2>/dev/null || true`, { stdio: 'ignore', timeout: 2000 });
            } catch {
              // Ignore
            }
          }
        }
      } catch {
        // Ignore - process may already be dead
      }
    }

    managedApiUrlOverride = null;
    detectedPort = null;
    version = null;
    setStatus('disconnected');
  }

  async function restartInternal(): Promise<void> {
    restartCount += 1;
    await stopInternal();
    await new Promise(r => setTimeout(r, 250));
    await startInternal(undefined, { rotateManaged: true });
  }

  async function start(workdir?: string): Promise<void> {
    if (pendingOperation) {
      await pendingOperation;
      if (server) {
        return;
      }
    }
    lastStartAttempts = 1;
    pendingOperation = startInternal(workdir, { rotateManaged: true });
    try {
      await pendingOperation;
    } finally {
      pendingOperation = null;
    }
  }

  async function stop(): Promise<void> {
    if (pendingOperation) {
      await pendingOperation;
    }
    // Check if already stopped
    if (!server) {
      return;
    }
    pendingOperation = stopInternal();
    try {
      await pendingOperation;
    } finally {
      pendingOperation = null;
    }
  }

  async function restart(): Promise<void> {
    if (pendingOperation) {
      await pendingOperation;
    }
    lastStartAttempts = 1;
    pendingOperation = restartInternal();
    try {
      await pendingOperation;
    } finally {
      pendingOperation = null;
    }
  }

  async function setWorkingDirectory(newPath: string): Promise<{ success: boolean; restarted: boolean; path: string }> {
    void newPath;
    const workspacePath = workspaceDirectory();
    const nextDirectory = workspacePath;

    if (workingDirectory === nextDirectory) {
      return { success: true, restarted: false, path: nextDirectory };
    }

    workingDirectory = nextDirectory;

    if (useConfiguredUrl && configuredApiUrl) {
      return { success: true, restarted: false, path: nextDirectory };
    }

    return { success: true, restarted: false, path: nextDirectory };
  }

  return {
    start,
    stop,
    restart,
    setWorkingDirectory,
    getStatus: () => status,
    getApiUrl,
    getKronosCodeAuthHeaders,
    getWorkingDirectory: () => workingDirectory,
    isCliAvailable: () => !cliMissing,
    getDebugInfo: () => {
      const secureConnection = Boolean(getKronosCodeAuthHeaders().Authorization);
      return {
        mode: useConfiguredUrl && configuredApiUrl ? 'external' : 'managed',
        status,
        lastError,
        workingDirectory,
        cliAvailable: !cliMissing,
        cliPath,
        configuredApiUrl: useConfiguredUrl && configuredApiUrl ? configuredApiUrl.replace(/\/+$/, '') : null,
        configuredPort,
        detectedPort,
        apiPrefix: '',
        apiPrefixDetected: true,
        startCount,
        restartCount,
        lastStartAt,
        lastConnectedAt,
        lastExitCode,
        serverUrl: getApiUrl(),
        lastReadyElapsedMs,
        lastReadyAttempts,
        lastStartAttempts,
        version,
        secureConnection,
        authSource: managedPasswordSource || (userProvidedEnvPassword ? 'user-env' : null),
      };
    },
    onStatusChange(callback) {
      listeners.add(callback);
      callback(status, lastError);
      return new vscode.Disposable(() => listeners.delete(callback));
    },
  };
}
