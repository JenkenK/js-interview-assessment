/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: [
        {
          find: /^@\/test\//,
          replacement: fileURLToPath(new URL('./test/', import.meta.url)),
        },
        {
          find: /^@\//,
          replacement: fileURLToPath(new URL('./src/', import.meta.url)),
        },
      ],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
    },
    server: {
      proxy: {
        '/api/currencybeacon': {
          target: 'https://api.currencybeacon.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/currencybeacon/, ''),
          headers: { Authorization: `Bearer ${env.CURRENCYBEACON_API_KEY}` },
        },
      },
    },
  }
})
