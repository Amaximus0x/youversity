import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    fs: {
      allow: ['static']
    }
  },
  build: {
    rollupOptions: {
      input: {
        'service-worker': 'static/service-worker.js'
      },
      external: [
        '@capacitor/core'  // Externalize Capacitor to avoid build errors
      ]
    }
  }
});