import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true, // fail instead of picking a random port
    hmr: {
      port: 5174,     // HMR WebSocket on the same port as the server
    },
  },
})
