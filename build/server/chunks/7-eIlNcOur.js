import { r as requireAuth } from './guards-CvbrOz4P.js';
import './index-DzcLzHBX.js';
import 'firebase-admin/auth';
import './firebase-admin-JLfANxfL.js';
import 'firebase-admin/app';
import './shared-server-BfUoNEXY.js';

const load = async (event) => {
  const user = await requireAuth(event);
  return {
    profile: {
      name: user.displayName,
      email: user.email,
      image: user.photoURL,
      id: user.uid
    }
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 7;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CuAzBGqr.js')).default;
const server_id = "src/routes/profile/+page.server.ts";
const imports = ["_app/immutable/nodes/7.B2Betk8E.js","_app/immutable/chunks/scheduler.DhsztkH2.js","_app/immutable/chunks/index.DK03Zu-C.js","_app/immutable/chunks/entry.XLM3-e4P.js","_app/immutable/chunks/index.hQFG0jTX.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-eIlNcOur.js.map
