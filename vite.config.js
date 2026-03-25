import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Default Vite dev server: listens on localhost (works with http://localhost:5173/).
// Production: relative ./ for GitHub Pages + `npm run preview`.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'production' ? './' : '/',
  server: {
    port: 5173,
    strictPort: false,
    /** Listen on all interfaces so localhost / 127.0.0.1 / LAN IP all work */
    host: true,
  },
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },
}))
