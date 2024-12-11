import { c as create_ssr_component, a as subscribe } from "../../../chunks/ssr.js";
import "../../../chunks/firebase.js";
import "../../../chunks/client.js";
import "../../../chunks/auth.js";
import { p as page } from "../../../chunks/stores.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `<div class="min-h-screen bg-gray-50"><div class="container mx-auto px-4 py-8">${`${`<div class="max-w-2xl mx-auto text-center" data-svelte-h="svelte-gmw3a5"><div class="animate-pulse"><div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div> <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div></div></div>`}`}</div></div>`;
  } while (!$$settled);
  $$unsubscribe_page();
  return $$rendered;
});
export {
  Page as default
};
