import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()], // Temporär vereinfacht ohne removeConsole
    server: {
        port: 5173,
        host: '0.0.0.0',
        origin: 'https://osuherz.ddns.net',
        allowedHosts: true,
        strictPort: true,
        cors: true,
        fs: {
            strict: false
        },
        hmr: {
            host: 'osuherz.ddns.net',
            protocol: 'wss',
            clientPort: 443
        },
    },
    preview: {
        port: 5173, // Hier kannst du den Port für Preview ebenfalls auf 5173 setzen, wenn du willst
        host: '0.0.0.0',
        allowedHosts: true
    },
})
