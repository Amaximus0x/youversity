import * as server from '../entries/pages/my-courses/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/my-courses/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/my-courses/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.RobkRg1P.js","_app/immutable/chunks/disclose-version.D7tGBA4G.js","_app/immutable/chunks/utils.DcsKdZEZ.js","_app/immutable/chunks/render.Cil4iE76.js","_app/immutable/chunks/if.C26WOn-M.js","_app/immutable/chunks/each.DNJP5h5E.js","_app/immutable/chunks/lifecycle.BCvgLVFS.js","_app/immutable/chunks/auth.C_d8jTao.js","_app/immutable/chunks/index.CC-aNF1f.js"];
export const stylesheets = [];
export const fonts = [];
