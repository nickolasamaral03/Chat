import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: 'client', // Set the root to the client directory
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  server: {
    port: 3000
  },
  build: {
    outDir: '../dist/client' // Adjust output directory relative to new root
  }
})