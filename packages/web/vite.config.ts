import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { VitePWA } from 'vite-plugin-pwa';
import { themeStoragePlugin } from '../../vite-theme-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  root: path.resolve(__dirname, '.'),
  plugins: [
    react(),
    themeStoragePlugin(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,otf,eot}'],
        // iOS Safari/PWA is much more reliable with a classic (non-module) SW bundle.
        rollupFormat: 'iife',
        // We already keep a custom manifest in index.html
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: [
      { find: '@opencode-ai/sdk/v2', replacement: path.resolve(__dirname, '../../node_modules/@opencode-ai/sdk/dist/v2/client.js') },
      { find: '@kronoscode-ai/sdk/v2', replacement: path.resolve(__dirname, '../../node_modules/@opencode-ai/sdk/dist/v2/client.js') },
      { find: '@kronoscode-ai/sdk/v2/client', replacement: path.resolve(__dirname, '../../node_modules/@opencode-ai/sdk/dist/v2/client.js') },
      { find: '@kronoscode-ai/ui', replacement: path.resolve(__dirname, '../ui/src') },
      { find: '@opencode-ai/ui', replacement: path.resolve(__dirname, '../ui/src') },
      { find: '@web', replacement: path.resolve(__dirname, './src') },
      { find: '@', replacement: path.resolve(__dirname, '../ui/src') },
    ],
  },
  worker: {
    format: 'es',
  },
  define: {
    'process.env': {},
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  optimizeDeps: {
    include: ['@opencode-ai/sdk/v2', 'date-fns'],
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: `http://127.0.0.1:${process.env.OPENCHAMBER_PORT || 3001}`,
        changeOrigin: true,
      },
      '/health': {
        target: `http://127.0.0.1:${process.env.OPENCHAMBER_PORT || 3001}`,
        changeOrigin: true,
      },
      '/api': {
        target: `http://127.0.0.1:${process.env.OPENCHAMBER_PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          let match = id.split('node_modules/')[1];
          if (!match) return undefined;
          let packageName: string | undefined;

          // Bun installs dependencies under:
          // node_modules/.bun/<pkg>@<ver>/node_modules/<actual-pkg>/...
          // Without this normalization everything can collapse into vendor-.bun.
          if (match.startsWith('.bun/')) {
            const bunSegments = match.split('/');
            const bunStoreEntry = bunSegments[1] || '';
            const versionSeparator = bunStoreEntry.lastIndexOf('@');
            const bunEncodedName =
              versionSeparator > 0 ? bunStoreEntry.slice(0, versionSeparator) : bunStoreEntry;
            const bunDecodedName = bunEncodedName.replace(/\+/g, '/');

            const nestedIndex = match.lastIndexOf('/node_modules/');
            if (nestedIndex >= 0) {
              match = match.slice(nestedIndex + '/node_modules/'.length);
            } else if (bunDecodedName) {
              packageName = bunDecodedName;
            }
          }

          if (!packageName) {
            const segments = match.split('/');
            packageName = match.startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0];
          }

          if (packageName === 'react' || packageName === 'react-dom') return 'vendor-react';
          if (packageName === 'zustand' || packageName === 'zustand/middleware') return 'vendor-zustand';

          if (packageName === '@opencode-ai/sdk') return 'vendor-opencode-sdk';
          if (packageName.includes('remark') || packageName.includes('rehype') || packageName === 'react-markdown') return 'vendor-markdown';
          if (packageName.startsWith('@radix-ui')) return 'vendor-radix';
          if (packageName.includes('react-syntax-highlighter') || packageName.includes('highlight.js')) return 'vendor-syntax';
          if (packageName.includes('mermaid')) return 'vendor-mermaid';
          if (
            packageName.startsWith('@shikijs')
            || packageName.includes('shiki')
            || packageName.includes('oniguruma')
          ) return 'vendor-shiki';
          if (
            packageName.startsWith('@codemirror')
            || packageName.startsWith('@lezer')
            || packageName === 'codemirror'
          ) return 'vendor-codemirror';
          if (packageName.includes('ghostty-web')) return 'vendor-ghostty-web';
          if (packageName.includes('cytoscape')) return 'vendor-cytoscape';
          if (packageName === 'heic2any') return 'vendor-heic2any';
          if (packageName === 'katex') return 'vendor-katex';

          return undefined;
        },
      },
    },
  },
});
