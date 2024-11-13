import { r as requireAuth } from './guards-CvbrOz4P.js';
import './index-DzcLzHBX.js';
import 'firebase-admin/auth';
import './firebase-admin-JLfANxfL.js';
import 'firebase-admin/app';
import './shared-server-BfUoNEXY.js';

const load = async (event) => {
  await requireAuth(event);
  return {};
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 6;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CEfOZtk6.js')).default;
const server_id = "src/routes/my-courses/+page.server.ts";
const imports = ["_app/immutable/nodes/6.BARZ4_mc.js","_app/immutable/chunks/scheduler.DhsztkH2.js","_app/immutable/chunks/index.DK03Zu-C.js","_app/immutable/chunks/each.D6YF6ztN.js","_app/immutable/chunks/auth.hjYb--ZN.js","_app/immutable/chunks/index.hQFG0jTX.js","_app/immutable/chunks/firebase.D9dyBQNl.js","_app/immutable/chunks/entry.XLM3-e4P.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=6-Bh5joO_-.js.map
