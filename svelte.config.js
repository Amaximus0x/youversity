import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import staticAdapter from '@sveltejs/adapter-static';
import nodeAdapter from '@sveltejs/adapter-node';

// Determine the adapter based on environment variable
const getAdapter = () => {
	const target = process.env.ADAPTER_TARGET?.toLowerCase();

	if (target === 'replit') {
		console.log('Using node adapter for Replit');
		return nodeAdapter({
			out: 'build',
			precompress: false,
			envPrefix: ''
		});
	} else if (target === 'capacitor') {
		console.log('Using static adapter for Capacitor');
		return staticAdapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		});
	} else {
		// Default to node adapter for Replit if ADAPTER_TARGET is not set or invalid
		console.warn('ADAPTER_TARGET not set or invalid, defaulting to node adapter for Replit');
		return nodeAdapter({
			out: 'build',
			precompress: false,
			envPrefix: ''
		});
		// Alternatively, you could throw an error:
		// throw new Error('ADAPTER_TARGET environment variable must be set to \'replit\' or \'capacitor\'');
	}
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: getAdapter(), // Call the function to get the correct adapter
		csrf: {
			checkOrigin: false
		}
	},
	preprocess: vitePreprocess()
};

export default config;