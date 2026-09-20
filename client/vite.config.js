import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
 
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, /api requests are forwarded to Express.
    // The browser thinks everything is one origin, so cookies just work.
    proxy: { '/api': 'http://localhost:5000' },
  },
});
 
