import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // Serve from the domain root by default. If you host the build in a
  // subfolder (e.g. XAMPP at http://localhost/portfolio/), build with:
  //   BASE_PATH=/portfolio/ pnpm build
  base: process.env.BASE_PATH || '/',

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: Number(process.env.PORT) || 5173,
    open: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
