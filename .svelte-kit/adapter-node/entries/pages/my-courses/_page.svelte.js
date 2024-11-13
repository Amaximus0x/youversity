import { c as create_ssr_component, a as subscribe, e as escape, d as each } from "../../../chunks/ssr.js";
import { u as user, i as isAuthenticated } from "../../../chunks/auth.js";
import { g as getUserCourses } from "../../../chunks/firebase.js";
import "../../../chunks/client.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $user, $$unsubscribe_user;
  let $isAuthenticated, $$unsubscribe_isAuthenticated;
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$unsubscribe_isAuthenticated = subscribe(isAuthenticated, (value) => $isAuthenticated = value);
  let courses = [];
  let loading = true;
  let error = null;
  async function loadCourses() {
    try {
      loading = true;
      error = null;
      if (!$user) {
        throw new Error("Please sign in to view your courses");
      }
      courses = await getUserCourses($user.uid);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  {
    if ($isAuthenticated) {
      loadCourses();
    }
  }
  $$unsubscribe_user();
  $$unsubscribe_isAuthenticated();
  return `<div class="container mx-auto px-4 py-8"><h1 class="text-3xl font-bold mb-8" data-svelte-h="svelte-9fonip">My Courses</h1> ${loading ? `<div class="text-center py-8" data-svelte-h="svelte-ediazw">Loading courses...</div>` : `${error ? `<div class="text-red-500 text-center py-8">${escape(error)}</div>` : `${courses.length === 0 ? `<div class="text-center py-8" data-svelte-h="svelte-1cjw1mw"><p class="mb-4">You haven&#39;t created any courses yet.</p> <a href="/create-course" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create Your First Course</a></div>` : `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${each(courses, (course) => {
    return `<button class="text-left border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:scale-102 bg-white"><h2 class="text-xl font-semibold mb-2 text-blue-600">${escape(course.Final_Course_Title)}</h2> <p class="text-gray-600 mb-4">${escape(course.Final_Course_Objective)}</p> <div class="flex justify-between items-center text-sm text-gray-500"><span>${escape(course.Final_Module_Title.length)} Modules</span> <span class="text-blue-500 hover:text-blue-700" data-svelte-h="svelte-69j7gf">View Course →</span></div> </button>`;
  })}</div>`}`}`}</div>`;
});
export {
  Page as default
};
