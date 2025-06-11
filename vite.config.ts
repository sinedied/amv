import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    lib: {
      entry: {
        'cli/index': 'src/cli/index.ts',
        'server/index': 'src/server/index.ts',
        'web/components': 'src/web/components.ts',
        'web/app': 'src/web/app.ts'
      },
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'node:fs',
        'node:path',
        'node:url',
        'fastify',
        '@fastify/static',
        'commander',
        'openai',
        'open'
      ],
      output: {
        format: 'es',
        entryFileNames: '[name].js'
      }
    }
  },
  publicDir: 'public'
});