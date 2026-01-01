import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['android >= 6', 'chrome >= 50', 'defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  server: {
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('lucide-react')) return 'lucide';
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
            return 'vendor';
          }
        }
      }
    }
  }
})
