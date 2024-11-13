import { c as create_ssr_component, a as subscribe, v as validate_component, e as escape } from './ssr-vuZdlTfL.js';
import { p as page } from './stores-CX61sbm7.js';
import { u as user, i as isAuthenticated } from './auth-kkRkzBXy.js';
import './auth2-D_qCq2Z-.js';
import { C as CourseGenerationProgress } from './CourseGenerationProgress-Dt_YjH5r.js';
import './client-CnCRRyPd.js';
import './exports-CTha0ECg.js';
import './index2-DBzPtTNm.js';
import './firebase-CTgjpWaB.js';
import 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_user;
  let $isAuthenticated, $$unsubscribe_isAuthenticated;
  let $page, $$unsubscribe_page;
  $$unsubscribe_user = subscribe(user, (value) => value);
  $$unsubscribe_isAuthenticated = subscribe(isAuthenticated, (value) => $isAuthenticated = value);
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_user();
  $$unsubscribe_isAuthenticated();
  $$unsubscribe_page();
  return `<nav class="bg-white shadow-lg fixed w-full top-0 z-50"><div class="max-w-7xl mx-auto px-4"><div class="flex justify-between items-center h-16"><div class="flex items-center" data-svelte-h="svelte-ayfvn6"><a href="/" class="text-xl font-bold text-blue-600">Youversity</a></div> <div class="hidden md:flex items-center space-x-4">${$isAuthenticated ? `<a href="/create-course" class="${"text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md " + escape(
    $page.url.pathname === "/create-course" ? "text-blue-600 font-medium" : "",
    true
  )}">Create Course</a> <a href="/my-courses" class="${"text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md " + escape(
    $page.url.pathname === "/my-courses" ? "text-blue-600 font-medium" : "",
    true
  )}">My Courses</a> <a href="/profile" class="${"text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md " + escape(
    $page.url.pathname === "/profile" ? "text-blue-600 font-medium" : "",
    true
  )}">My Profile</a> <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-svelte-h="svelte-19vortq">Sign Out</button>` : `<button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-svelte-h="svelte-1vu4pgd">Sign In</button>`}</div> <div class="md:hidden"><button class="text-gray-600 hover:text-gray-900" data-svelte-h="svelte-lz9b2q"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg></button></div></div></div></nav> ${validate_component(CourseGenerationProgress, "CourseGenerationProgress").$$render($$result, {}, {}, {})} <main class="pt-16">${slots.default ? slots.default({}) : ``}</main>`;
});

export { Layout as default };
//# sourceMappingURL=_layout.svelte-CJsatjSp.js.map
