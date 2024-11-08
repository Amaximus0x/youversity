import { I as escape_html, C as store_get, F as unsubscribe_stores } from "../../../chunks/index.js";
import { u as user } from "../../../chunks/auth.js";
function _page($$payload) {
  var $$store_subs;
  $$payload.out += `<h1>Protected Page</h1> <p>If you can see this, you're authenticated!</p> <pre>${escape_html(JSON.stringify(store_get($$store_subs ??= {}, "$user", user), null, 2))}</pre>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
}
export {
  _page as default
};
