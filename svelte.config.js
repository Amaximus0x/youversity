import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import staticAdapter from '@sveltejs/adapter-static';
import nodeAdapter from '@sveltejs/adapter-node';
import vercelAdapter from '@sveltejs/adapter-vercel';

// Determine the adapter based on environment variable
const getAdapter = () => {
	const target = process.env.ADAPTER_TARGET?.toLowerCase();

	if (target === 'vercel') {
		console.log('Using Vercel adapter');
		return vercelAdapter();
	} else if (target === 'replit') {
		console.log('Using Node adapter for Replit');
		return nodeAdapter({ out: 'build' });
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
		// Default to static for web
		return staticAdapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		});
	}
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: getAdapter(), // Call the function to get the correct adapter
		csrf: {
			checkOrigin: false
		},
		appDir: '_app',
		paths: {
			base: '',
			assets: ''
		},
		serviceWorker: {
			register: true,
			files: (filepath) => !/\.DS_Store/.test(filepath)
		},
		prerender: {
			handleHttpError: 'warn',
			entries: ['/'] // Only prerender the home page
		}
	},
	preprocess: vitePreprocess()
};

export default config;