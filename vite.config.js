import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev: fixed port for this repo only (avoids clashing with other Vite apps on 5173).
// Production: relative ./ for GitHub Pages + `npm run preview`.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'production' ? './' : '/',
  server: {
    port: 5181,
    strictPort: true,
    /** Listen on all interfaces so localhost / 127.0.0.1 / LAN IP all work */
    host: true,
  },
  preview: {
    port: 4180,
    strictPort: true,
    host: true,
  },
}))
