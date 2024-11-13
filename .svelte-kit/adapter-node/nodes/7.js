import * as server from '../entries/pages/profile/_page.server.ts.js';

export const index = 7;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/profile/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/profile/+page.server.ts";
export const imports = ["_app/immutable/nodes/7.B2Betk8E.js","_app/immutable/chunks/scheduler.DhsztkH2.js","_app/immutable/chunks/index.DK03Zu-C.js","_app/immutable/chunks/entry.XLM3-e4P.js","_app/immutable/chunks/index.hQFG0jTX.js"];
export const stylesheets = [];
export const fonts = [];
