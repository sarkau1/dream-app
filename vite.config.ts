import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Set by the GitHub Pages deploy workflow to "/<repo-name>/"; defaults to "/" for local dev
  // and for hosts that serve from the domain root (e.g. Vercel/Netlify/a custom domain).
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
