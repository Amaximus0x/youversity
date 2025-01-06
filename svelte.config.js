import vercelAdapter from '@sveltejs/adapter-vercel';
import nodeAdapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const DEPLOYMENT_PLATFORM = process.env.DEPLOYMENT_PLATFORM || 'vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: DEPLOYMENT_PLATFORM === 'replit' 
			? nodeAdapter({
					out: 'build',
					precompress: false,
					envPrefix: ''
				})
			: vercelAdapter({
					runtime: 'nodejs20.x'
				}),
		csrf: {
			checkOrigin: false
		}
	},
	preprocess: vitePreprocess()
};

export default config;