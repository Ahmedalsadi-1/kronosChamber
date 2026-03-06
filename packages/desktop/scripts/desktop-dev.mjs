#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const desktopDir = path.join(repoRoot, 'packages/desktop');

function spawnProcess(command, args, opts = {}) {
  return spawn(command, args, {
    cwd: repoRoot,
    env: { ...process.env },
    stdio: 'inherit',
    ...opts,
  });
}

function withDesktopDevDefaults(baseEnv = process.env) {
  const env = { ...baseEnv };

  if (typeof env.OPENCHAMBER_DESKTOP_SKIP_WEB_BUILD !== 'string') {
    env.OPENCHAMBER_DESKTOP_SKIP_WEB_BUILD = '1';
  }
  if (typeof env.OPENCHAMBER_DESKTOP_SKIP_RESOURCE_SYNC !== 'string') {
    env.OPENCHAMBER_DESKTOP_SKIP_RESOURCE_SYNC = '1';
  }
  if (typeof env.OPENCHAMBER_DESKTOP_SKIP_SIDECAR_BUILD !== 'string') {
    env.OPENCHAMBER_DESKTOP_SKIP_SIDECAR_BUILD = '1';
  }
  if (typeof env.OPENCHAMBER_DESKTOP_DISABLE_VITE !== 'string') {
    env.OPENCHAMBER_DESKTOP_DISABLE_VITE = '1';
  }

  return env;
}

async function main() {
  const prebuildEnv = withDesktopDevDefaults(process.env);
  const prebuild = spawnSync('node', ['./packages/desktop/scripts/build-sidecar.mjs'], {
    cwd: repoRoot,
    env: prebuildEnv,
    stdio: 'inherit',
  });
  if (prebuild.error) {
    throw prebuild.error;
  }
  if (prebuild.status !== 0) {
    throw new Error(`Sidecar prebuild failed with status ${prebuild.status}`);
  }

  const tauriProcess = spawnProcess('bun', [
    '--cwd',
    desktopDir,
    'tauri',
    'dev',
    '--features',
    'devtools',
    '--config',
    './src-tauri/tauri.dev.conf.json',
  ], {
    env: withDesktopDevDefaults(process.env),
  });

  let cleaning = false;

  const teardown = async (code) => {
    if (cleaning) {
      return;
    }
    cleaning = true;

    const stopChild = (child, label) => {
      if (!child || child.killed) {
        return;
      }
      try {
        child.kill('SIGINT');
      } catch (error) {
        console.warn(`[desktop:dev] Failed to stop ${label}:`, error);
      }
    };

    stopChild(tauriProcess, 'Tauri dev process');

    process.exit(typeof code === 'number' ? code : 0);
  };

  const handleChildExit = (childName) => (code, signal) => {
    if (code !== 0 || signal) {
      console.warn(`[desktop:dev] ${childName} exited with code ${code ?? 'null'} signal ${signal ?? 'none'}.`);
    }
    teardown(code).catch((error) => {
      console.error('[desktop:dev] Cleanup error:', error);
      process.exit(code ?? 1);
    });
  };

  tauriProcess.on('exit', handleChildExit('Tauri dev process'));
  const errorHandler = (label) => (error) => {
    console.error(`[desktop:dev] Failed to start ${label}:`, error);
    teardown(1).catch(() => process.exit(1));
  };

  tauriProcess.on('error', errorHandler('Tauri dev process'));

  const signalExitCodes = {
    SIGINT: 130,
    SIGTERM: 143,
    SIGQUIT: 131,
  };

  Object.entries(signalExitCodes).forEach(([signal, exitCode]) => {
    process.on(signal, () => {
      teardown(exitCode).catch(() => process.exit(exitCode));
    });
  });
}

main().catch((error) => {
  console.error('[desktop:dev] Unexpected error:', error);
  process.exit(1);
});
