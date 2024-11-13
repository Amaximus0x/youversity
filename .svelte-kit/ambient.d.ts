
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const ORIGIN: string;
	export const REPLIT_PID1_FLAG_REPLIT_RTLD_LOADER: string;
	export const AUTH_SECRET: string;
	export const GOOGLE_CLIENT_ID: string;
	export const GOOGLE_CLIENT_SECRET: string;
	export const VITE_FIREBASE_API_KEY: string;
	export const VITE_FIREBASE_AUTH_DOMAIN: string;
	export const VITE_FIREBASE_PROJECT_ID: string;
	export const VITE_FIREBASE_STORAGE_BUCKET: string;
	export const VITE_FIREBASE_MESSAGING_SENDER_ID: string;
	export const VITE_FIREBASE_APP_ID: string;
	export const FIREBASE_ADMIN_CLIENT_EMAIL: string;
	export const FIREBASE_ADMIN_PRIVATE_KEY: string;
	export const FIREBASE_PROJECT_ID: string;
	export const OPENAI_API_KEY: string;
	export const ALLUSERSPROFILE: string;
	export const APPDATA: string;
	export const ChocolateyInstall: string;
	export const ChocolateyLastPathUpdate: string;
	export const CHROME_CRASHPAD_PIPE_NAME: string;
	export const COLOR: string;
	export const COLORTERM: string;
	export const CommonProgramFiles: string;
	export const CommonProgramW6432: string;
	export const COMPUTERNAME: string;
	export const ComSpec: string;
	export const DriverData: string;
	export const EDITOR: string;
	export const EFC_3184: string;
	export const FPS_BROWSER_APP_PROFILE_STRING: string;
	export const FPS_BROWSER_USER_PROFILE_STRING: string;
	export const GIT_ASKPASS: string;
	export const HOME: string;
	export const HOMEDRIVE: string;
	export const HOMEPATH: string;
	export const INIT_CWD: string;
	export const JAVA_HOME: string;
	export const LANG: string;
	export const LOCALAPPDATA: string;
	export const LOGONSERVER: string;
	export const NODE: string;
	export const NODE_ENV: string;
	export const NODE_EXE: string;
	export const NPM_CLI_JS: string;
	export const npm_command: string;
	export const npm_config_userconfig: string;
	export const COLORTERM: string;
	export const npm_config_cache: string;
	export const FIREBASE_ADMIN_CLIENT_EMAIL: string;
	export const REPL_OWNER: string;
	export const NIXPKGS_ALLOW_UNFREE: string;
	export const HOSTNAME: string;
	export const __EGL_VENDOR_LIBRARY_FILENAMES: string;
	export const NODE: string;
	export const REPLIT_DOMAINS: string;
	export const NODE_EXTRA_CA_CERTS: string;
	export const XDG_DATA_HOME: string;
	export const REPL_OWNER_ID: string;
	export const XDG_CONFIG_HOME: string;
	export const GOOGLE_CLIENT_ID: string;
	export const REPLIT_LD_AUDIT: string;
	export const COLOR: string;
	export const OPENAI_API_KEY: string;
	export const npm_config_local_prefix: string;
	export const DENO_TLS_CA_STORE: string;
	export const REPLIT_CLI: string;
	export const GIT_CONFIG_GLOBAL: string;
	export const npm_config_globalconfig: string;
	export const EDITOR: string;
	export const REPLIT_USER: string;
	export const REPLIT_SUBCLUSTER: string;
	export const PWD: string;
	export const NIX_PROFILES: string;
	export const REPLIT_DB_URL: string;
	export const REPLIT_SESSION: string;
	export const NIX_PATH: string;
	export const npm_config_init_module: string;
	export const GOOGLE_CLIENT_SECRET: string;
	export const REPL_ID: string;
	export const FIREBASE_APP_ID: string;
	export const HOME: string;
	export const LANG: string;
	export const REPL_IDENTITY: string;
	export const REPLIT_RIPPKGS_INDICES: string;
	export const npm_package_version: string;
	export const GIT_ASKPASS: string;
	export const FIREBASE_API_KEY: string;
	export const REPLIT_USER_RUN: string;
	export const REPL_IMAGE: string;
	export const DIRENV_CONFIG: string;
	export const INIT_CWD: string;
	export const REPLIT_PID1_FLAG_NIXMODULES_BEFORE_REPLIT_NIX: string;
	export const XDG_CACHE_HOME: string;
	export const npm_lifecycle_script: string;
	export const REPLIT_RTLD_LOADER: string;
	export const npm_config_npm_version: string;
	export const FIREBASE_AUTH_DOMAIN: string;
	export const REPLIT_DEV_DOMAIN: string;
	export const TERM: string;
	export const npm_package_name: string;
	export const REPLIT_CLUSTER: string;
	export const REPLIT_BASHRC: string;
	export const npm_config_prefix: string;
	export const REPL_LANGUAGE: string;
	export const FIREBASE_PROJECT_ID: string;
	export const FIREBASE_ADMIN_PRIVATE_KEY: string;
	export const USER: string;
	export const REPL_HOME: string;
	export const REPLIT_PID1_VERSION: string;
	export const DISPLAY: string;
	export const npm_lifecycle_event: string;
	export const SHLVL: string;
	export const FIREBASE_MESSAGING_SENDER_ID: string;
	export const REPLIT_NIX_CHANNEL: string;
	export const GIT_EDITOR: string;
	export const REPLIT_USERID: string;
	export const LIBGL_DRIVERS_PATH: string;
	export const LOCALE_ARCHIVE: string;
	export const npm_config_user_agent: string;
	export const npm_execpath: string;
	export const SSL_CERT_FILE: string;
	export const REPLIT_ENVIRONMENT: string;
	export const REQUESTS_CA_BUNDLE: string;
	export const npm_package_json: string;
	export const REPL_IDENTITY_KEY: string;
	export const npm_config_noproxy: string;
	export const PATH: string;
	export const npm_config_node_gyp: string;
	export const DOCKER_CONFIG: string;
	export const npm_config_global_prefix: string;
	export const REPL_PUBKEYS: string;
	export const FIREBASE_STORAGE_BUCKET: string;
	export const AUTH_SECRET: string;
	export const npm_node_execpath: string;
	export const npm_config_engine_strict: string;
	export const REPL_SLUG: string;
	export const npm_package_engines_node: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		ORIGIN: string;
		REPLIT_PID1_FLAG_REPLIT_RTLD_LOADER: string;
		AUTH_SECRET: string;
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;
		VITE_FIREBASE_API_KEY: string;
		VITE_FIREBASE_AUTH_DOMAIN: string;
		VITE_FIREBASE_PROJECT_ID: string;
		VITE_FIREBASE_STORAGE_BUCKET: string;
		VITE_FIREBASE_MESSAGING_SENDER_ID: string;
		VITE_FIREBASE_APP_ID: string;
		FIREBASE_ADMIN_CLIENT_EMAIL: string;
		FIREBASE_ADMIN_PRIVATE_KEY: string;
		FIREBASE_PROJECT_ID: string;
		OPENAI_API_KEY: string;
		ALLUSERSPROFILE: string;
		APPDATA: string;
		ChocolateyInstall: string;
		ChocolateyLastPathUpdate: string;
		CHROME_CRASHPAD_PIPE_NAME: string;
		COLOR: string;
		COLORTERM: string;
		CommonProgramFiles: string;
		CommonProgramW6432: string;
		COMPUTERNAME: string;
		ComSpec: string;
		DriverData: string;
		EDITOR: string;
		EFC_3184: string;
		FPS_BROWSER_APP_PROFILE_STRING: string;
		FPS_BROWSER_USER_PROFILE_STRING: string;
		GIT_ASKPASS: string;
		HOME: string;
		HOMEDRIVE: string;
		HOMEPATH: string;
		INIT_CWD: string;
		JAVA_HOME: string;
		LANG: string;
		LOCALAPPDATA: string;
		LOGONSERVER: string;
		NODE: string;
		NODE_ENV: string;
		NODE_EXE: string;
		NPM_CLI_JS: string;
		npm_command: string;
		npm_config_userconfig: string;
		COLORTERM: string;
		npm_config_cache: string;
		FIREBASE_ADMIN_CLIENT_EMAIL: string;
		REPL_OWNER: string;
		NIXPKGS_ALLOW_UNFREE: string;
		HOSTNAME: string;
		__EGL_VENDOR_LIBRARY_FILENAMES: string;
		NODE: string;
		REPLIT_DOMAINS: string;
		NODE_EXTRA_CA_CERTS: string;
		XDG_DATA_HOME: string;
		REPL_OWNER_ID: string;
		XDG_CONFIG_HOME: string;
		GOOGLE_CLIENT_ID: string;
		REPLIT_LD_AUDIT: string;
		COLOR: string;
		OPENAI_API_KEY: string;
		npm_config_local_prefix: string;
		DENO_TLS_CA_STORE: string;
		REPLIT_CLI: string;
		GIT_CONFIG_GLOBAL: string;
		npm_config_globalconfig: string;
		EDITOR: string;
		REPLIT_USER: string;
		REPLIT_SUBCLUSTER: string;
		PWD: string;
		NIX_PROFILES: string;
		REPLIT_DB_URL: string;
		REPLIT_SESSION: string;
		NIX_PATH: string;
		npm_config_init_module: string;
		GOOGLE_CLIENT_SECRET: string;
		REPL_ID: string;
		FIREBASE_APP_ID: string;
		HOME: string;
		LANG: string;
		REPL_IDENTITY: string;
		REPLIT_RIPPKGS_INDICES: string;
		npm_package_version: string;
		GIT_ASKPASS: string;
		FIREBASE_API_KEY: string;
		REPLIT_USER_RUN: string;
		REPL_IMAGE: string;
		DIRENV_CONFIG: string;
		INIT_CWD: string;
		REPLIT_PID1_FLAG_NIXMODULES_BEFORE_REPLIT_NIX: string;
		XDG_CACHE_HOME: string;
		npm_lifecycle_script: string;
		REPLIT_RTLD_LOADER: string;
		npm_config_npm_version: string;
		FIREBASE_AUTH_DOMAIN: string;
		REPLIT_DEV_DOMAIN: string;
		TERM: string;
		npm_package_name: string;
		REPLIT_CLUSTER: string;
		REPLIT_BASHRC: string;
		npm_config_prefix: string;
		REPL_LANGUAGE: string;
		FIREBASE_PROJECT_ID: string;
		FIREBASE_ADMIN_PRIVATE_KEY: string;
		USER: string;
		REPL_HOME: string;
		REPLIT_PID1_VERSION: string;
		DISPLAY: string;
		npm_lifecycle_event: string;
		SHLVL: string;
		FIREBASE_MESSAGING_SENDER_ID: string;
		REPLIT_NIX_CHANNEL: string;
		GIT_EDITOR: string;
		REPLIT_USERID: string;
		LIBGL_DRIVERS_PATH: string;
		LOCALE_ARCHIVE: string;
		npm_config_user_agent: string;
		npm_execpath: string;
		SSL_CERT_FILE: string;
		REPLIT_ENVIRONMENT: string;
		REQUESTS_CA_BUNDLE: string;
		npm_package_json: string;
		REPL_IDENTITY_KEY: string;
		npm_config_noproxy: string;
		PATH: string;
		npm_config_node_gyp: string;
		DOCKER_CONFIG: string;
		npm_config_global_prefix: string;
		REPL_PUBKEYS: string;
		FIREBASE_STORAGE_BUCKET: string;
		AUTH_SECRET: string;
		npm_node_execpath: string;
		npm_config_engine_strict: string;
		REPL_SLUG: string;
		npm_package_engines_node: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
