import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  optimizeDeps: {
    include: ['@breezystack/lamejs'],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HabboTraxPlayer',
      fileName: 'habbo-trax-player',
      formats: ['iife'],
    },
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
  publicDir: 'assets',
});
