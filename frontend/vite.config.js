import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/news': 'http://localhost:8000',
      '/engagement': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
    },
  },
});
