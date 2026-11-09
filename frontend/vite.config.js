import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on 0.0.0.0 so you can reach it from outside the container
    port: 9000,
    watch: {
      usePolling: true, // sets up watch so the container shows updates in real time
    }
  }
})
