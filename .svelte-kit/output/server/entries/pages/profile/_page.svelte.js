import { J as attr, I as escape_html, K as bind_props } from "../../../chunks/index.js";
import "../../../chunks/client.js";
function _page($$payload, $$props) {
  let data = $$props["data"];
  const { profile } = data;
  $$payload.out += `<div class="max-w-2xl mx-auto p-4"><h1 class="text-2xl font-bold mb-6">Profile</h1> `;
  if (profile) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="space-y-4">`;
    if (profile.image) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="flex justify-center"><img${attr("src", profile.image)}${attr("alt", profile.name || "Profile")} class="w-24 h-24 rounded-full"></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="space-y-2"><div><span class="font-semibold">Name:</span> <span>${escape_html(profile.name || "Not provided")}</span></div> <div><span class="font-semibold">Email:</span> <span>${escape_html(profile.email || "Not provided")}</span></div> <div><span class="font-semibold">User ID:</span> <span>${escape_html(profile.id || "Not available")}</span></div></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<p>Loading profile...</p>`;
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { data });
}
export {
  _page as default
};
