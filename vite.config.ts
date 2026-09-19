import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// A relative base keeps production assets valid on both a custom domain and a
// GitHub Pages project URL (for example /sbh-ride/).
export default defineConfig({
  base: './',
  plugins: [react()],
})
