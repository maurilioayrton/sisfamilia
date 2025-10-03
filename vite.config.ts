
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    jsxImportSource: 'react'
  })],
  define: {
    __BASE_PATH__: JSON.stringify(process.env.BASE_PATH || '/')
  },
  esbuild: {
    jsx: 'automatic'
  }
})
