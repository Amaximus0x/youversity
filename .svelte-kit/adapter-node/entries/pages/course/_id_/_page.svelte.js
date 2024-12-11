import { c as create_ssr_component, a as subscribe } from "../../../../chunks/ssr.js";
import { p as page } from "../../../../chunks/stores.js";
import "../../../../chunks/client.js";
import { u as user } from "../../../../chunks/auth.js";
import "../../../../chunks/firebase.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  let $$unsubscribe_user;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_user = subscribe(user, (value) => value);
  $$unsubscribe_page();
  $$unsubscribe_user();
  return `<div class="min-h-screen bg-gradient-to-br from-red-50 to-white text-red-900"><main class="container mx-auto px-4 py-8 max-w-4xl">${`<div class="text-center py-8" data-svelte-h="svelte-1iaydl6"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto"></div> <p class="mt-4">Loading course...</p></div>`}</main></div>`;
});
export {
  Page as default
};
