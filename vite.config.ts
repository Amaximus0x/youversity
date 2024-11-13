import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      clientPort: 443
    }
  },
  ssr: {
    noExternal: ['axios'] // Add this line to handle axios in SSR
  },
  build: {
    rollupOptions: {
      external: [] // Empty array to not exclude any dependencies
    }
  }
});