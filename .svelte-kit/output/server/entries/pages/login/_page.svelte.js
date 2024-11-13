import { c as create_ssr_component, a as subscribe } from "../../../chunks/ssr.js";
import "../../../chunks/auth2.js";
import { p as page } from "../../../chunks/stores.js";
import "../../../chunks/client.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_page();
  return `<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white"><div class="max-w-md w-full p-8 bg-white rounded-lg shadow-lg"><h1 class="text-3xl font-bold text-center mb-8" data-svelte-h="svelte-vz6d5e">Sign In to Youversity</h1> ${``} <button class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-3" data-svelte-h="svelte-1kztjrs"><img src="/google-icon.svg" alt="Google" class="w-6 h-6">
      Continue with Google</button></div></div>`;
});
export {
  Page as default
};
