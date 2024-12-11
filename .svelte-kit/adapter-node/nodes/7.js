import * as server from '../entries/pages/profile/_page.server.ts.js';

export const index = 7;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/profile/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/profile/+page.server.ts";
export const imports = ["_app/immutable/nodes/7.DbXpBZNK.js","_app/immutable/chunks/scheduler.Bnsic3yX.js","_app/immutable/chunks/index.C8E8-Cgp.js","_app/immutable/chunks/entry.DtpcrjWd.js","_app/immutable/chunks/index.B8ZMw-jm.js","_app/immutable/chunks/auth.DvMvzZyN.js","_app/immutable/chunks/firebase.CVhbrlsA.js","_app/immutable/chunks/CourseList.BJFC-kGq.js","_app/immutable/chunks/index.BKJh-5Rc.js","_app/immutable/chunks/Icon.OXNpAjVm.js","_app/immutable/chunks/each.D6YF6ztN.js"];
export const stylesheets = ["_app/immutable/assets/Skeleton.BvdsXIbv.css"];
export const fonts = [];
