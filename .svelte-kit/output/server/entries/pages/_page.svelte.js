import { I as escape_html, C as store_get, F as unsubscribe_stores, B as pop, z as push } from "../../chunks/index.js";
import { u as user } from "../../chunks/auth.js";
import "../../chunks/auth2.js";
import "../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  $$payload.out += `<div class="text-center py-12 space-y-8"><h1 class="text-4xl font-bold">Welcome to Youversity</h1> <button class="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors">${escape_html(store_get($$store_subs ??= {}, "$user", user) ? "Continue to Course Creation" : "Start with Google")}</button></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
