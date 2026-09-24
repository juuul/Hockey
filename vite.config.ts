import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => ({
  base: command === 'build' ? (mode === 'test' ? '/Hockey/test/' : '/Hockey/') : '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: false
  }
}))
