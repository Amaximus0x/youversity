import * as server from '../entries/pages/profile/_page.server.ts.js';

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/profile/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/profile/+page.server.ts";
export const imports = ["_app/immutable/nodes/5.BL8YfZ5L.js","_app/immutable/chunks/disclose-version.D7tGBA4G.js","_app/immutable/chunks/utils.DcsKdZEZ.js","_app/immutable/chunks/render.Cil4iE76.js","_app/immutable/chunks/if.C26WOn-M.js","_app/immutable/chunks/attributes.CT2dYRmI.js","_app/immutable/chunks/props.OFLBkJCG.js","_app/immutable/chunks/entry.BZKgMnzz.js","_app/immutable/chunks/index.CC-aNF1f.js"];
export const stylesheets = [];
export const fonts = [];
