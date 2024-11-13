import { c as create_ssr_component, a as subscribe, e as escape } from './ssr-vuZdlTfL.js';
import { u as user } from './auth-kkRkzBXy.js';
import './auth2-D_qCq2Z-.js';
import { p as page } from './stores-CX61sbm7.js';
import './index2-DBzPtTNm.js';
import './firebase-CTgjpWaB.js';
import 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import './client-CnCRRyPd.js';
import './exports-CTha0ECg.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $user, $$unsubscribe_user;
  let $$unsubscribe_page;
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_user();
  $$unsubscribe_page();
  return `<div class="text-center py-12 space-y-8"><h1 class="text-4xl font-bold" data-svelte-h="svelte-v4qvq8">Welcome to Youversity</h1> <button class="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors">${escape($user ? "Continue to Course Creation" : "Start with Google")}</button></div>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-DuQjFGvk.js.map
