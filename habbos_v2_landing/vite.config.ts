import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  publicDir: 'assets',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HabbosV2Landing',
      fileName: 'habbos-v2-landing',
      formats: ['iife'],
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
  plugins: [
    {
      name: 'generate-dist-html',
      closeBundle() {
        const html = readFileSync('index.html', 'utf8')
          .replace('<script type="module" src="/src/index.ts"></script>', '<script src="./habbos-v2-landing.iife.js"></script>');
        writeFileSync('dist/index.html', html);
      },
    },
  ],
});
