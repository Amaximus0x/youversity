import * as server from '../entries/pages/create-course/_page.server.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/create-course/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/create-course/+page.server.ts";
export const imports = ["_app/immutable/nodes/3.Crfkgas_.js","_app/immutable/chunks/disclose-version.D7tGBA4G.js","_app/immutable/chunks/utils.DcsKdZEZ.js","_app/immutable/chunks/if.C26WOn-M.js","_app/immutable/chunks/lifecycle.BCvgLVFS.js","_app/immutable/chunks/render.Cil4iE76.js","_app/immutable/chunks/attributes.CT2dYRmI.js","_app/immutable/chunks/props.OFLBkJCG.js","_app/immutable/chunks/each.DNJP5h5E.js","_app/immutable/chunks/index-client.Buh_srdv.js","_app/immutable/chunks/auth.x_EDYfZ2.js","_app/immutable/chunks/index.CC-aNF1f.js","_app/immutable/chunks/entry.BZKgMnzz.js"];
export const stylesheets = [];
export const fonts = [];
