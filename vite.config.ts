import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
            return 'vendor';
          }
          if (id.includes('/src/deal-engine/')) return 'deal-engine';
          if (id.includes('/src/finalisation/')) return 'finalisation';
        },
      },
    },
  },
});
