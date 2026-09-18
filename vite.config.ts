import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/unified/entry.ts'),
      name: 'DRGUnifiedBundle',
      formats: ['iife'],
      fileName: () => 'app.js',
    },
    outDir: 'dist/scripts',
    sourcemap: false,
    minify: 'esbuild',
  },
});
