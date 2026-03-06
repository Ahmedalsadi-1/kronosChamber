export interface DesktopControlEnvField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  secret?: boolean;
  description?: string;
}

export interface DesktopControlMcpServer {
  id: string;
  mcpName: string;
  name: string;
  description: string;
  repositoryUrl: string;
  command: string;
  args: string[];
  stars: number;
  language: string;
  features: string[];
  defaultScope: 'user' | 'project';
  requiredEnv: DesktopControlEnvField[];
  optionalEnv: DesktopControlEnvField[];
}

export const REMOTE_MACOS_USE_PRESET_ID = 'remote-macos-use';

export const DESKTOP_CONTROL_MCP_SERVERS: DesktopControlMcpServer[] = [
  {
    id: REMOTE_MACOS_USE_PRESET_ID,
    mcpName: 'remote-macos',
    name: 'Remote macOS',
    description:
      'Control a remote macOS desktop through MCP using a local source-installed launcher (no Docker required).',
    repositoryUrl: 'https://github.com/baryhuang/mcp-remote-macos-use.git',
    command: '~/.kronoscode/mcp-servers/bin/mcp-remote-macos-use',
    args: [],
    stars: 120,
    language: 'Python',
    features: ['screenshots', 'mouse', 'keyboard', 'apps', 'remote-macos', 'webrtc'],
    defaultScope: 'user',
    requiredEnv: [
      {
        key: 'MACOS_HOST',
        label: 'macOS host',
        placeholder: 'mac.example.local or 10.0.0.12',
        required: true,
      },
      {
        key: 'MACOS_PASSWORD',
        label: 'macOS password',
        placeholder: 'Remote Mac login password',
        required: true,
        secret: true,
      },
      {
        key: 'MACOS_USERNAME',
        label: 'macOS username',
        placeholder: 'Optional for some setups',
        required: false,
      },
    ],
    optionalEnv: [
      {
        key: 'MACOS_PORT',
        label: 'macOS port',
        placeholder: '5900 (optional)',
        description: 'Optional if your remote setup exposes a non-default port.',
      },
    ],
  },
  {
    id: 'automation-mcp',
    mcpName: 'automation-mcp',
    name: 'Automation MCP (local macOS)',
    description:
      'Local desktop automation MCP for macOS (mouse, keyboard, screenshots, and window controls) without remote host setup.',
    repositoryUrl: 'https://github.com/ashwwwin/automation-mcp.git',
    command: 'bun',
    args: ['run', '~/.kronoscode/mcp-servers/automation-mcp/index.ts', '--stdio'],
    stars: 0,
    language: 'TypeScript',
    features: ['local-macos', 'screenshot', 'mouse', 'keyboard', 'window-control'],
    defaultScope: 'user',
    requiredEnv: [],
    optionalEnv: [],
  },
];
