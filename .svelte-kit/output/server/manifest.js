export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.CrXld7bg.js","app":"_app/immutable/entry/app.DlOBn2tu.js","imports":["_app/immutable/entry/start.CrXld7bg.js","_app/immutable/chunks/entry.BZKgMnzz.js","_app/immutable/chunks/utils.DcsKdZEZ.js","_app/immutable/chunks/index.CC-aNF1f.js","_app/immutable/entry/app.DlOBn2tu.js","_app/immutable/chunks/utils.DcsKdZEZ.js","_app/immutable/chunks/render.Cil4iE76.js","_app/immutable/chunks/disclose-version.D7tGBA4G.js","_app/immutable/chunks/if.C26WOn-M.js","_app/immutable/chunks/props.OFLBkJCG.js","_app/immutable/chunks/index-client.Buh_srdv.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/auth/refresh-token",
				pattern: /^\/api\/auth\/refresh-token\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/refresh-token/_server.ts.js'))
			},
			{
				id: "/api/auth/session",
				pattern: /^\/api\/auth\/session\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/session/_server.ts.js'))
			},
			{
				id: "/api/courses",
				pattern: /^\/api\/courses\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/courses/_server.ts.js'))
			},
			{
				id: "/api/create-final-course",
				pattern: /^\/api\/create-final-course\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/create-final-course/_server.ts.js'))
			},
			{
				id: "/api/generate-course",
				pattern: /^\/api\/generate-course\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/generate-course/_server.ts.js'))
			},
			{
				id: "/api/search-videos",
				pattern: /^\/api\/search-videos\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/search-videos/_server.ts.js'))
			},
			{
				id: "/api/video-metadata",
				pattern: /^\/api\/video-metadata\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/video-metadata/_server.ts.js'))
			},
			{
				id: "/api/video-transcript",
				pattern: /^\/api\/video-transcript\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/video-transcript/_server.ts.js'))
			},
			{
				id: "/create-course",
				pattern: /^\/create-course\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/my-courses",
				pattern: /^\/my-courses\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/profile",
				pattern: /^\/profile\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/protected",
				pattern: /^\/protected\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
