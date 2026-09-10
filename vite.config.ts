import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/star-game/' : '/',
  plugins: [react()],
  server: {
    port: 5176,
    open: true,
  },
})
