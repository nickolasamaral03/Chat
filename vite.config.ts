import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.join(__dirname, 'client'),
  publicDir: path.join(__dirname, 'client/public'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'client/src'),
    },
  },
  build: {
    outDir: path.join(__dirname, 'dist/client'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.join(__dirname, 'client/index.html'),
      },
    },
  },
});