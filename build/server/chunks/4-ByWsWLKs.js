import { r as requireAuth } from './guards-CvbrOz4P.js';
import './index-DzcLzHBX.js';
import 'firebase-admin/auth';
import './firebase-admin-JLfANxfL.js';
import 'firebase-admin/app';
import './shared-server-BfUoNEXY.js';

const load = async (event) => {
  await requireAuth(event);
  return {
    // Add any additional data needed for course creation
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 4;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-HP0tX8CB.js')).default;
const server_id = "src/routes/create-course/+page.server.ts";
const imports = ["_app/immutable/nodes/4.C1FgNLXS.js","_app/immutable/chunks/scheduler.DhsztkH2.js","_app/immutable/chunks/index.DK03Zu-C.js","_app/immutable/chunks/each.D6YF6ztN.js","_app/immutable/chunks/firebase.D9dyBQNl.js","_app/immutable/chunks/entry.XLM3-e4P.js","_app/immutable/chunks/index.hQFG0jTX.js","_app/immutable/chunks/auth.hjYb--ZN.js","_app/immutable/chunks/CourseGenerationProgress.ExnoVqK1.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=4-ByWsWLKs.js.map
