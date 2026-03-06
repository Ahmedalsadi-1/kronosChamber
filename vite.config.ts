import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { themeStoragePlugin } from './vite-theme-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    themeStoragePlugin(),
  ],
  resolve: {
    alias: [
      { find: '@opencode-ai/sdk/v2', replacement: path.resolve(__dirname, './node_modules/@opencode-ai/sdk/dist/v2/client.js') },
      { find: '@kronoscode-ai/sdk/v2', replacement: path.resolve(__dirname, './node_modules/@opencode-ai/sdk/dist/v2/client.js') },
      { find: '@kronoscode-ai/sdk/v2/client', replacement: path.resolve(__dirname, './node_modules/@opencode-ai/sdk/dist/v2/client.js') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  worker: {
    format: 'es',
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@opencode-ai/sdk/v2'],
  },
  build: {
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          let match = id.split('node_modules/')[1]
          if (!match) return undefined
          let packageName

          // Bun installs dependencies under:
          // node_modules/.bun/<pkg>@<ver>/node_modules/<actual-pkg>/...
          // Without this normalization everything can collapse into vendor-.bun.
          if (match.startsWith('.bun/')) {
            const bunSegments = match.split('/')
            const bunStoreEntry = bunSegments[1] || ''
            const versionSeparator = bunStoreEntry.lastIndexOf('@')
            const bunEncodedName = versionSeparator > 0 ? bunStoreEntry.slice(0, versionSeparator) : bunStoreEntry
            const bunDecodedName = bunEncodedName.replace(/\+/g, '/')

            const nestedIndex = match.lastIndexOf('/node_modules/')
            if (nestedIndex >= 0) {
              match = match.slice(nestedIndex + '/node_modules/'.length)
            } else if (bunDecodedName) {
              packageName = bunDecodedName
            }
          }

          if (!packageName) {
            const segments = match.split('/')
            packageName = match.startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0]
          }

          if (packageName === 'react' || packageName === 'react-dom') return 'vendor-react'
          if (packageName === 'zustand' || packageName === 'zustand/middleware') return 'vendor-zustand'
          if (packageName === '@opencode-ai/sdk') return 'vendor-opencode-sdk'
          if (packageName.includes('remark') || packageName.includes('rehype') || packageName === 'react-markdown') return 'vendor-markdown'
          if (packageName.startsWith('@radix-ui')) return 'vendor-radix'
          if (packageName.includes('react-syntax-highlighter') || packageName.includes('highlight.js')) return 'vendor-syntax'
          if (packageName.includes('mermaid')) return 'vendor-mermaid'
          if (
            packageName.startsWith('@shikijs')
            || packageName.includes('shiki')
            || packageName.includes('oniguruma')
          ) return 'vendor-shiki'
          if (
            packageName.startsWith('@codemirror')
            || packageName.startsWith('@lezer')
            || packageName === 'codemirror'
          ) return 'vendor-codemirror'
          if (packageName.includes('ghostty-web')) return 'vendor-ghostty-web'
          if (packageName.includes('cytoscape')) return 'vendor-cytoscape'
          if (packageName === 'heic2any') return 'vendor-heic2any'
          if (packageName === 'katex') return 'vendor-katex'

          return undefined
        },
      },
    },
  },
})
