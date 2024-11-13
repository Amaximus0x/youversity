import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Custom configuration for Replit
			out: 'build',
			precompress: false,
			envPrefix: ''
		}),
		// Add this csrf configuration
		csrf: {
			checkOrigin: false
		}
	},
	preprocess: vitePreprocess()
};

export default config;