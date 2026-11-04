import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Any request starting with /api is forwarded to the ASP.NET Core API.
    // This avoids CORS problems during development.
    proxy: {
      '/api': {
        // Port 5080 is open in BOTH Visual Studio profiles ("https" and "http")
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
})
