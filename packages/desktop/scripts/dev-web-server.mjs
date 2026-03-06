import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const desktopDir = path.join(repoRoot, 'packages', 'desktop');
const tauriDir = path.join(desktopDir, 'src-tauri');

const inferTargetTriple = () => {
  const fromEnv = typeof process.env.TAURI_ENV_TARGET_TRIPLE === 'string' ? process.env.TAURI_ENV_TARGET_TRIPLE.trim() : '';
  if (fromEnv) return fromEnv;

  if (process.platform === 'darwin') {
    return process.arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
  }

  if (process.platform === 'win32') {
    return 'x86_64-pc-windows-msvc';
  }

  if (process.platform === 'linux') {
    return process.arch === 'arm64' ? 'aarch64-unknown-linux-gnu' : 'x86_64-unknown-linux-gnu';
  }

  return `${process.arch}-${process.platform}`;
};

const targetTriple = inferTargetTriple();
const sidecarName = process.platform === 'win32'
  ? `openchamber-server-${targetTriple}.exe`
  : `openchamber-server-${targetTriple}`;

const sidecarPath = path.join(tauriDir, 'sidecars', sidecarName);
const webDir = path.join(repoRoot, 'packages', 'web');
const webDistDir = path.join(webDir, 'dist');
const apiPort = 3001;
const apiBase = `http://127.0.0.1:${apiPort}`;

const run = (cmd, args, cwd, extraEnv = {}) => {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readStdoutLines = (result) => {
  if (result?.error || typeof result?.stdout !== 'string') {
    return [];
  }
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const canConnectToPort = (port, host = '127.0.0.1') =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {}
      resolve(value);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(400, () => finish(false));
  });

const makeAbortSignal = (timeoutMs) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref?.();
  return controller.signal;
};

const getListeningPids = (port) => {
  if (process.platform === 'win32') {
    return [];
  }
  const result = spawnSync('lsof', ['-nP', '-t', `-iTCP:${port}`, '-sTCP:LISTEN'], {
    encoding: 'utf8',
  });
  if (result.error) {
    return [];
  }
  return readStdoutLines(result)
    .map((line) => Number.parseInt(line, 10))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
};

const isPortOccupied = async (port, host = '127.0.0.1') => {
  if (await canConnectToPort(port, host)) {
    return true;
  }
  return getListeningPids(port).length > 0;
};

const getProcessCommand = (pid) => {
  if (!Number.isInteger(pid) || pid <= 0 || process.platform === 'win32') {
    return '';
  }
  const result = spawnSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' });
  if (result.error) {
    return '';
  }
  return (result.stdout || '').trim();
};

const isOpenChamberProcess = (command) => {
  const normalized = command.toLowerCase();
  return (
    normalized.includes('openchamber-server') ||
    normalized.includes('openchamber-desktop') ||
    normalized.includes('/openchamb') ||
    normalized.includes('kronoschamber') ||
    normalized.includes('dev-web-server.mjs')
  );
};

const killPid = (pid, signal) => {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
};

const terminateStaleOpenChamberListeners = async (port) => {
  const pids = getListeningPids(port);
  if (pids.length === 0) {
    return false;
  }

  const openChamberPids = [];
  for (const pid of pids) {
    const command = getProcessCommand(pid);
    if (isOpenChamberProcess(command)) {
      openChamberPids.push(pid);
    }
  }

  if (openChamberPids.length === 0) {
    return false;
  }

  console.warn(`[desktop] terminating stale OpenChamber process(es) on port ${port}: ${openChamberPids.join(', ')}`);
  for (const pid of openChamberPids) {
    killPid(pid, 'SIGTERM');
  }

  const softDeadline = Date.now() + 4000;
  while (Date.now() < softDeadline) {
    const remaining = getListeningPids(port);
    const blocking = remaining.filter((pid) => openChamberPids.includes(pid));
    if (blocking.length === 0) {
      return true;
    }
    await delay(150);
  }

  for (const pid of openChamberPids) {
    killPid(pid, 'SIGKILL');
  }

  const hardDeadline = Date.now() + 2500;
  while (Date.now() < hardDeadline) {
    if (!(await isPortOccupied(port))) {
      return true;
    }
    await delay(120);
  }

  return !(await isPortOccupied(port));
};

const maybeShutdownExistingOpenChamber = async () => {
  if (!(await isPortOccupied(apiPort))) {
    return;
  }

  let looksLikeOpenChamber = false;
  try {
    const response = await fetch(`${apiBase}/health`, {
      method: 'GET',
      signal: makeAbortSignal(1500),
    });
    if (response.ok) {
      const payload = await response.json().catch(() => null);
      looksLikeOpenChamber = Boolean(payload && typeof payload === 'object' && payload.status === 'ok');
    }
  } catch {}

  if (looksLikeOpenChamber) {
    console.log(`[desktop] port ${apiPort} already has OpenChamber, requesting shutdown...`);
    try {
      await fetch(`${apiBase}/api/system/shutdown`, {
        method: 'POST',
        signal: makeAbortSignal(1500),
      });
    } catch {}
  }

  const waitUntil = Date.now() + (looksLikeOpenChamber ? 10000 : 2500);
  while (Date.now() < waitUntil) {
    if (!(await isPortOccupied(apiPort))) {
      return;
    }
    await delay(250);
  }

  if (await isPortOccupied(apiPort)) {
    const cleaned = await terminateStaleOpenChamberListeners(apiPort);
    if (cleaned && !(await isPortOccupied(apiPort))) {
      return;
    }
    throw new Error(`Port ${apiPort} is in use. Stop the process using this port and retry.`);
  }
};

async function main() {
  console.log('[desktop] ensuring sidecar + web-dist...');
  const buildSidecarEnv = {};

  const forceSidecarBuild = process.env.OPENCHAMBER_DESKTOP_FORCE_SIDECAR_BUILD === '1';

  buildSidecarEnv.OPENCHAMBER_DESKTOP_SKIP_RESOURCE_SYNC =
    typeof process.env.OPENCHAMBER_DESKTOP_SKIP_RESOURCE_SYNC === 'string'
      ? process.env.OPENCHAMBER_DESKTOP_SKIP_RESOURCE_SYNC
      : '1';

  buildSidecarEnv.OPENCHAMBER_DESKTOP_SKIP_SIDECAR_BUILD =
    typeof process.env.OPENCHAMBER_DESKTOP_SKIP_SIDECAR_BUILD === 'string'
      ? process.env.OPENCHAMBER_DESKTOP_SKIP_SIDECAR_BUILD
      : (forceSidecarBuild ? '0' : '1');

  if (typeof process.env.OPENCHAMBER_DESKTOP_SKIP_WEB_BUILD === 'string') {
    buildSidecarEnv.OPENCHAMBER_DESKTOP_SKIP_WEB_BUILD = process.env.OPENCHAMBER_DESKTOP_SKIP_WEB_BUILD;
  }

  run('node', ['./scripts/build-sidecar.mjs'], desktopDir, buildSidecarEnv);
  await maybeShutdownExistingOpenChamber();

  console.log(`[desktop] starting API server on http://127.0.0.1:${apiPort} ...`);

  const apiChild = spawn(sidecarPath, ['--port', String(apiPort)], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      OPENCHAMBER_HOST: '127.0.0.1',
      OPENCHAMBER_DIST_DIR: webDistDir,
      NO_PROXY: process.env.NO_PROXY || 'localhost,127.0.0.1',
      no_proxy: process.env.no_proxy || 'localhost,127.0.0.1',
    },
  });

  const shouldStartVite = process.env.OPENCHAMBER_DESKTOP_DISABLE_VITE !== '1';
  let webChild = null;

  if (shouldStartVite) {
    console.log('[desktop] starting Vite HMR server on http://127.0.0.1:5173 ...');

    webChild = spawn('bun', ['x', 'vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
      cwd: webDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        OPENCHAMBER_PORT: process.env.OPENCHAMBER_PORT || String(apiPort),
        NO_PROXY: process.env.NO_PROXY || 'localhost,127.0.0.1',
        no_proxy: process.env.no_proxy || 'localhost,127.0.0.1',
      },
    });
  } else {
    console.log('[desktop] OPENCHAMBER_DESKTOP_DISABLE_VITE=1 -> skipping Vite HMR; desktop will use local API UI.');
  }

  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;

    try {
      apiChild.kill('SIGTERM');
    } catch {}

    try {
      webChild?.kill('SIGTERM');
    } catch {}
  };

  const handleExit = (label, options = { allowFailure: false }) => (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const hasError = code !== 0 || signal;
    if (hasError && options.allowFailure) {
      console.warn(
        `[desktop] ${label} exited unexpectedly (code=${code ?? 'null'} signal=${signal ?? 'none'}), continuing without it.`
      );
      return;
    }

    if (hasError) {
      console.error(`[desktop] ${label} exited unexpectedly (code=${code ?? 'null'} signal=${signal ?? 'none'})`);
    }

    shutdown();
    process.exit(typeof code === 'number' ? code : 1);
  };

  apiChild.on('exit', handleExit('API server'));
  if (webChild) {
    webChild.on('exit', handleExit('Vite server', { allowFailure: true }));
  }

  const handleError = (label) => (error) => {
    if (shuttingDown) {
      return;
    }
    console.error(`[desktop] failed to start ${label}:`, error);
    shutdown();
    process.exit(1);
  };

  apiChild.on('error', handleError('API server'));
  if (webChild) {
    webChild.on('error', handleError('Vite server'));
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);
}

main().catch((error) => {
  console.error('[desktop] dev-web-server failed:', error);
  process.exit(1);
});
