const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","favicon.png.ico","images/course-placeholder.png","service-worker.js"]),
	mimeTypes: {".png":"image/png",".js":"text/javascript"},
	_: {
		client: {"start":"_app/immutable/entry/start.DcgfPk8h.js","app":"_app/immutable/entry/app.ZNz6JPSg.js","imports":["_app/immutable/entry/start.DcgfPk8h.js","_app/immutable/chunks/entry.DtpcrjWd.js","_app/immutable/chunks/scheduler.Bnsic3yX.js","_app/immutable/chunks/index.B8ZMw-jm.js","_app/immutable/entry/app.ZNz6JPSg.js","_app/immutable/chunks/scheduler.Bnsic3yX.js","_app/immutable/chunks/index.C8E8-Cgp.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-DI6MkAJ5.js')),
			__memo(() => import('./chunks/1-BAtU2ymT.js')),
			__memo(() => import('./chunks/2-B_jikYy5.js')),
			__memo(() => import('./chunks/3-XaPdykKh.js')),
			__memo(() => import('./chunks/4-C-g-mCNF.js')),
			__memo(() => import('./chunks/5-Dzu_MppT.js')),
			__memo(() => import('./chunks/6-DEH6kU7k.js')),
			__memo(() => import('./chunks/7-D51wNIxh.js')),
			__memo(() => import('./chunks/8-rsTWufsX.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-B9dws0im.js'))
			},
			{
				id: "/api/generate-course",
				pattern: /^\/api\/generate-course\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-ZHVUi1p2.js'))
			},
			{
				id: "/api/search-videos",
				pattern: /^\/api\/search-videos\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CHJkHRtz.js'))
			},
			{
				id: "/api/video-metadata",
				pattern: /^\/api\/video-metadata\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DgIurZ1-.js'))
			},
			{
				id: "/api/video-transcript",
				pattern: /^\/api\/video-transcript\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-4wG_ZH_7.js'))
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
