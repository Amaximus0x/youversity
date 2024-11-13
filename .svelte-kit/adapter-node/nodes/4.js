import * as server from '../entries/pages/create-course/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/create-course/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/create-course/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.C1FgNLXS.js","_app/immutable/chunks/scheduler.DhsztkH2.js","_app/immutable/chunks/index.DK03Zu-C.js","_app/immutable/chunks/each.D6YF6ztN.js","_app/immutable/chunks/firebase.D9dyBQNl.js","_app/immutable/chunks/entry.XLM3-e4P.js","_app/immutable/chunks/index.hQFG0jTX.js","_app/immutable/chunks/auth.hjYb--ZN.js","_app/immutable/chunks/CourseGenerationProgress.ExnoVqK1.js"];
export const stylesheets = [];
export const fonts = [];
