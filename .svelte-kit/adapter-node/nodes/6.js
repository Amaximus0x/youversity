import * as server from '../entries/pages/my-courses/_page.server.ts.js';

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/my-courses/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/my-courses/+page.server.ts";
export const imports = ["_app/immutable/nodes/6.BARZ4_mc.js","_app/immutable/chunks/scheduler.DhsztkH2.js","_app/immutable/chunks/index.DK03Zu-C.js","_app/immutable/chunks/each.D6YF6ztN.js","_app/immutable/chunks/auth.hjYb--ZN.js","_app/immutable/chunks/index.hQFG0jTX.js","_app/immutable/chunks/firebase.D9dyBQNl.js","_app/immutable/chunks/entry.XLM3-e4P.js"];
export const stylesheets = [];
export const fonts = [];
