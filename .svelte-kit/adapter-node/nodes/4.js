import * as server from '../entries/pages/create-course/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/create-course/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/create-course/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.BQ7we2u3.js","_app/immutable/chunks/scheduler.Bnsic3yX.js","_app/immutable/chunks/index.C8E8-Cgp.js","_app/immutable/chunks/each.D6YF6ztN.js","_app/immutable/chunks/index.BKJh-5Rc.js","_app/immutable/chunks/Icon.OXNpAjVm.js","_app/immutable/chunks/firebase.CVhbrlsA.js","_app/immutable/chunks/entry.DtpcrjWd.js","_app/immutable/chunks/index.B8ZMw-jm.js","_app/immutable/chunks/auth.DvMvzZyN.js","_app/immutable/chunks/loadingState.DN6zOGXI.js","_app/immutable/chunks/CourseGenerationProgress.DsPLC8CF.js","_app/immutable/chunks/stores.0H9y5_v4.js"];
export const stylesheets = ["_app/immutable/assets/4.S6UQkjpw.css"];
export const fonts = [];
