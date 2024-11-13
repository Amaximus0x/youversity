import { c as create_ssr_component, b as add_attribute, e as escape } from "../../../chunks/ssr.js";
import "../../../chunks/client.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  const { profile } = data;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `<div class="max-w-2xl mx-auto p-4"><h1 class="text-2xl font-bold mb-6" data-svelte-h="svelte-dh0sxb">Profile</h1> ${profile ? `<div class="space-y-4">${profile.image ? `<div class="flex justify-center"><img${add_attribute("src", profile.image, 0)}${add_attribute("alt", profile.name || "Profile", 0)} class="w-24 h-24 rounded-full"></div>` : ``} <div class="space-y-2"><div><span class="font-semibold" data-svelte-h="svelte-etco9t">Name:</span> <span>${escape(profile.name || "Not provided")}</span></div> <div><span class="font-semibold" data-svelte-h="svelte-z1jqoe">Email:</span> <span>${escape(profile.email || "Not provided")}</span></div> <div><span class="font-semibold" data-svelte-h="svelte-qfrrfe">User ID:</span> <span>${escape(profile.id || "Not available")}</span></div></div></div>` : `<p data-svelte-h="svelte-y2oeu7">Loading profile...</p>`}</div>`;
});
export {
  Page as default
};
