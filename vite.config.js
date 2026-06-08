import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so the built bundle works when Electron loads it over file://
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
