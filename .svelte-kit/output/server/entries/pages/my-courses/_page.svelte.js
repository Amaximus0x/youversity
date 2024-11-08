import { C as store_get, F as unsubscribe_stores, B as pop, I as escape_html, L as ensure_array_like, z as push } from "../../../chunks/index.js";
import { u as user, g as getUserCourses, i as isAuthenticated } from "../../../chunks/auth.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let courses = [];
  let loading = true;
  let error = null;
  async function loadCourses() {
    try {
      loading = true;
      error = null;
      if (!store_get($$store_subs ??= {}, "$user", user)) {
        throw new Error("Please sign in to view your courses");
      }
      courses = await getUserCourses(store_get($$store_subs ??= {}, "$user", user).uid);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  if (store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated)) {
    loadCourses();
  }
  $$payload.out += `<div class="container mx-auto px-4 py-8"><h1 class="text-3xl font-bold mb-8">My Courses</h1> `;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="text-center py-8">Loading courses...</div>`;
  } else {
    $$payload.out += "<!--[!-->";
    if (error) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="text-red-500 text-center py-8">${escape_html(error)}</div>`;
    } else {
      $$payload.out += "<!--[!-->";
      if (courses.length === 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="text-center py-8"><p class="mb-4">You haven't created any courses yet.</p> <a href="/create-course" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create Your First Course</a></div>`;
      } else {
        $$payload.out += "<!--[!-->";
        const each_array = ensure_array_like(courses);
        $$payload.out += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><!--[-->`;
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let course = each_array[$$index];
          $$payload.out += `<div class="border rounded-lg p-6 hover:shadow-lg transition-shadow"><h2 class="text-xl font-semibold mb-2">${escape_html(course.Final_Course_Title)}</h2> <p class="text-gray-600 mb-4">${escape_html(course.Final_Course_Objective)}</p></div>`;
        }
        $$payload.out += `<!--]--></div>`;
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
