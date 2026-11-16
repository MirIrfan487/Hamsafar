import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Play Store build (npm run build:android:release): stop if the API address is missing or not https,
  // so a release can never point at a PC on plain http (see .env.android-release.example).
  if (mode === 'android-release') {
    const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL ?? ''
    if (!apiUrl.startsWith('https://')) {
      throw new Error(
        `VITE_API_URL must be an https:// address for the release build (got "${apiUrl}"). Set it in .env.android-release.`,
      )
    }
  }

  return {
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
        // SignalR (live chat). ws: true lets WebSockets through the proxy.
        '/hubs': {
          target: 'http://localhost:5080',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
