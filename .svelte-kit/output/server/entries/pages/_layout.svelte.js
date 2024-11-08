import { C as store_get, E as slot, F as unsubscribe_stores, B as pop, z as push } from "../../chunks/index.js";
import { u as user } from "../../chunks/auth.js";
import "../../chunks/auth2.js";
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  $$payload.out += `<div class="min-h-screen"><header class="bg-white shadow"><nav class="container mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center gap-4"><a href="/" class="text-3xl font-bold text-red-600">Youversity</a></div> <div class="flex items-center gap-4">`;
  if (store_get($$store_subs ??= {}, "$user", user)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<a href="/my-courses" class="text-gray-600 hover:text-gray-900 ml-4">My Courses</a>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (store_get($$store_subs ??= {}, "$user", user)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<a href="/profile" class="text-gray-600 hover:text-gray-900">Profile</a> <button class="text-red-500 hover:text-red-700">Sign out</button>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<button class="text-blue-500 hover:text-blue-700">Sign up with Google</button>`;
  }
  $$payload.out += `<!--]--></div></nav></header> <main class="container mx-auto px-4 py-8"><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></main></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
