import type { RuntimeAPIs, TerminalAPI, NotificationsAPI, InterconnectAPI } from '@kronoscode-ai/ui/lib/api/types';
import { createVSCodeFilesAPI } from './files';
import { createVSCodeSettingsAPI } from './settings';
import { createVSCodePermissionsAPI } from './permissions';
import { createVSCodeToolsAPI } from './tools';
import { createVSCodeEditorAPI } from './editor';
import { createVSCodeGitAPI } from './git';
import { createVSCodeActionsAPI } from './vscode';
import { createVSCodeGitHubAPI } from './github';

// Stub APIs return sensible defaults instead of throwing
const createStubTerminalAPI = (): TerminalAPI => ({
  createSession: async () => ({ sessionId: '', cols: 80, rows: 24 }),
  connect: () => ({ close: () => {} }),
  sendInput: async () => {},
  resize: async () => {},
  close: async () => {},
});

const createStubNotificationsAPI = (): NotificationsAPI => ({
  notifyAgentCompletion: async () => true,
  canNotify: () => true,
});

const createStubInterconnectAPI = (): InterconnectAPI => ({
  getState: async () => null,
  subscribeStatus: () => () => {},
  subscribeEvents: () => () => {},
  forceReconnect: async () => false,
});

export const createVSCodeAPIs = (): RuntimeAPIs => ({
  runtime: { platform: 'vscode', isDesktop: false, isVSCode: true, label: 'VS Code Extension' },
  terminal: createStubTerminalAPI(),
  git: createVSCodeGitAPI(),
  files: createVSCodeFilesAPI(),
  settings: createVSCodeSettingsAPI(),
  permissions: createVSCodePermissionsAPI(),
  notifications: createStubNotificationsAPI(),
  github: createVSCodeGitHubAPI(),
  interconnect: createStubInterconnectAPI(),
  tools: createVSCodeToolsAPI(),
  editor: createVSCodeEditorAPI(),
  vscode: createVSCodeActionsAPI(),
});
