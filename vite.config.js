import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Lets the client call a relative /api/grade instead of a hardcoded
    // localhost URL, so the same build works in production.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
})
