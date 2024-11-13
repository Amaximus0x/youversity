const manifest = (() => {
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
		client: {"start":"_app/immutable/entry/start.DVmCEMDf.js","app":"_app/immutable/entry/app.I29R-eE3.js","imports":["_app/immutable/entry/start.DVmCEMDf.js","_app/immutable/chunks/entry.XLM3-e4P.js","_app/immutable/chunks/scheduler.DhsztkH2.js","_app/immutable/chunks/index.hQFG0jTX.js","_app/immutable/entry/app.I29R-eE3.js","_app/immutable/chunks/scheduler.DhsztkH2.js","_app/immutable/chunks/index.DK03Zu-C.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-Hx6C8x7q.js')),
			__memo(() => import('./chunks/1-BF56Pj7K.js')),
			__memo(() => import('./chunks/2-1SJF0KAL.js')),
			__memo(() => import('./chunks/3-B1QOoI65.js')),
			__memo(() => import('./chunks/4-ByWsWLKs.js')),
			__memo(() => import('./chunks/5-ChUay0K9.js')),
			__memo(() => import('./chunks/6-Bh5joO_-.js')),
			__memo(() => import('./chunks/7-eIlNcOur.js')),
			__memo(() => import('./chunks/8-BM0iW-1m.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-B1SOrWJN.js'))
			},
			{
				id: "/api/auth/session",
				pattern: /^\/api\/auth\/session\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bc-9VrWD.js'))
			},
			{
				id: "/api/courses",
				pattern: /^\/api\/courses\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DHbR07Ik.js'))
			},
			{
				id: "/api/create-final-course",
				pattern: /^\/api\/create-final-course\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C3lJRgtu.js'))
			},
			{
				id: "/api/generate-course",
				pattern: /^\/api\/generate-course\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DU1BoQ--.js'))
			},
			{
				id: "/api/search-videos",
				pattern: /^\/api\/search-videos\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CR5UjOgQ.js'))
			},
			{
				id: "/api/video-metadata",
				pattern: /^\/api\/video-metadata\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CJFQV0lw.js'))
			},
			{
				id: "/api/video-transcript",
				pattern: /^\/api\/video-transcript\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BW5LR4Hz.js'))
			},
			{
				id: "/course/[id]",
				pattern: /^\/course\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/create-course",
				pattern: /^\/create-course\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/my-courses",
				pattern: /^\/my-courses\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/profile",
				pattern: /^\/profile\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/protected",
				pattern: /^\/protected\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
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

const prerendered = new Set([]);

export { manifest, prerendered };
//# sourceMappingURL=manifest.js.map
