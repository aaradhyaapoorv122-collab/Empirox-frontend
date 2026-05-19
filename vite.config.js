import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // Remove root or set it to '.' because vite.config.js is already in Frontend
  // root: '.',  // default root is current folder, so you can omit this line
base: "./",

  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // src folder relative to vite.config.js
    },
  },
})
