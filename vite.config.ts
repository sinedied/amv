import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist/web',
    rollupOptions: {
      input: 'src/web/app.ts',
      output: {
        format: 'es',
        entryFileNames: 'app.js'
      }
    }
  },
  publicDir: 'public'
});