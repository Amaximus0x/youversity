import * as server from '../entries/pages/my-courses/_page.server.ts.js';

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/my-courses/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/my-courses/+page.server.ts";
export const imports = ["_app/immutable/nodes/6.B4sd4RIi.js","_app/immutable/chunks/scheduler.Bnsic3yX.js","_app/immutable/chunks/index.C8E8-Cgp.js"];
export const stylesheets = [];
export const fonts = [];
