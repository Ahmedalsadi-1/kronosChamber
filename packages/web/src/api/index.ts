import type { RuntimeAPIs } from '@kronoscode-ai/ui/lib/api/types';
import { createWebTerminalAPI } from './terminal';
import { createWebGitAPI } from './git';
import { createWebFilesAPI } from './files';
import { createWebSettingsAPI } from './settings';
import { createWebPermissionsAPI } from './permissions';
import { createWebNotificationsAPI } from './notifications';
import { createWebToolsAPI } from './tools';
import { createWebPushAPI } from './push';
import { createWebGitHubAPI } from './github';
import { createWebInterconnectAPI } from './interconnect';

const detectDesktopShell = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const globalWindow = window as typeof window & {
    __TAURI__?: unknown;
    __KRONOSCHAMBER_DESKTOP__?: boolean;
    __KRONOSCHAMBER_LOCAL_ORIGIN__?: string;
    __TAURI_INTERNALS__?: unknown;
    __TAURI_IPC__?: unknown;
  };

  const hasDesktopMarker = globalWindow.__KRONOSCHAMBER_DESKTOP__ === true;
  const hasTauri = Boolean(globalWindow.__TAURI__);
  const hasTauriInternals = Boolean(globalWindow.__TAURI_INTERNALS__);
  const hasTauriIpc = typeof globalWindow.__TAURI_IPC__ === 'function';
  const hasLocalOrigin = typeof globalWindow.__KRONOSCHAMBER_LOCAL_ORIGIN__ === 'string'
    && globalWindow.__KRONOSCHAMBER_LOCAL_ORIGIN__.length > 0;
  const hasTauriUserAgent = typeof navigator !== 'undefined' && /tauri/i.test(navigator.userAgent || '');

  return hasDesktopMarker || hasTauri || hasTauriInternals || hasTauriIpc || hasLocalOrigin || hasTauriUserAgent;
};

export const createWebAPIs = (): RuntimeAPIs => {
  const isDesktop = detectDesktopShell();

  return {
    runtime: {
      platform: isDesktop ? 'desktop' : 'web',
      isDesktop,
      isVSCode: false,
      label: isDesktop ? 'desktop' : 'web',
    },
  terminal: createWebTerminalAPI(),
  git: createWebGitAPI(),
  files: createWebFilesAPI(),
  settings: createWebSettingsAPI(),
  permissions: createWebPermissionsAPI(),
  notifications: createWebNotificationsAPI(),
  github: createWebGitHubAPI(),
  push: createWebPushAPI(),
  interconnect: createWebInterconnectAPI(),
  tools: createWebToolsAPI(),
  };
};
