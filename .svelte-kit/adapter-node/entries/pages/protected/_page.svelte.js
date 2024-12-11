import { c as create_ssr_component, a as subscribe, b as escape } from "../../../chunks/ssr.js";
import { u as user } from "../../../chunks/auth.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $user, $$unsubscribe_user;
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$unsubscribe_user();
  return `<h1 data-svelte-h="svelte-196pl0p">Protected Page</h1> <p data-svelte-h="svelte-1d3xdnw">If you can see this, you&#39;re authenticated!</p> <pre>${escape(JSON.stringify($user, null, 2))}</pre>`;
});
export {
  Page as default
};
