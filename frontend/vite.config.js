import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  base: '/',
  server: {
    host: true,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].${Date.now()}.js`,
        chunkFileNames: `assets/[name].[hash].${Date.now()}.js`,
        assetFileNames: `assets/[name].[hash].${Date.now()}.[ext]`
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
