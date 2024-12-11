import { c as create_ssr_component, a as subscribe, v as validate_component, d as add_attribute, b as escape } from "../../../chunks/ssr.js";
import "../../../chunks/client.js";
import { u as user } from "../../../chunks/auth.js";
import { g as getUserCourses } from "../../../chunks/firebase.js";
import { S as Skeleton, C as CourseFilter, a as CourseList, b as ShareModal } from "../../../chunks/CourseList.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $user, $$unsubscribe_user;
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  let { data } = $$props;
  const { profile } = data;
  let userCourses = [];
  let loading = false;
  let error = null;
  let filteredCourses = userCourses;
  let showShareModal = false;
  let selectedCourseId = "";
  async function loadUserCourses() {
    try {
      loading = true;
      error = null;
      userCourses = await getUserCourses($user.uid);
      filteredCourses = [...userCourses];
    } catch (err) {
      console.error("Error loading courses:", err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  function handleShareCourse(courseId) {
    selectedCourseId = courseId;
    showShareModal = true;
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  {
    if ($user) {
      loadUserCourses();
    }
  }
  $$unsubscribe_user();
  return `<div class="container mx-auto px-4 py-8"><h1 class="text-3xl font-bold text-[#2A4D61] mb-8" data-svelte-h="svelte-1i9v8uz">Profile</h1> <div class="bg-white rounded-lg shadow-md p-6 mb-8">${!profile ? `<div class="space-y-4"><div class="flex items-center space-x-4">${validate_component(Skeleton, "Skeleton").$$render(
    $$result,
    {
      height: "96px",
      width: "96px",
      borderRadius: "50%"
    },
    {},
    {}
  )} <div class="space-y-2 flex-1">${validate_component(Skeleton, "Skeleton").$$render($$result, { height: "24px", width: "150px" }, {}, {})} ${validate_component(Skeleton, "Skeleton").$$render($$result, { height: "20px", width: "200px" }, {}, {})}</div></div> <div class="space-y-3">${validate_component(Skeleton, "Skeleton").$$render($$result, { height: "20px", width: "80%" }, {}, {})} ${validate_component(Skeleton, "Skeleton").$$render($$result, { height: "20px", width: "60%" }, {}, {})} ${validate_component(Skeleton, "Skeleton").$$render($$result, { height: "20px", width: "70%" }, {}, {})}</div></div>` : `<div class="flex flex-col md:flex-row md:items-center gap-6">${profile.image ? `<div class="flex-shrink-0"><img${add_attribute("src", profile.image, 0)}${add_attribute("alt", profile.name || "Profile", 0)} class="w-24 h-24 rounded-full"></div>` : ``} <div class="space-y-2"><div><span class="font-semibold" data-svelte-h="svelte-etco9t">Name:</span> <span>${escape(profile.name || "Not provided")}</span></div> <div><span class="font-semibold" data-svelte-h="svelte-z1jqoe">Email:</span> <span>${escape(profile.email || "Not provided")}</span></div> <div><span class="font-semibold" data-svelte-h="svelte-qfrrfe">User ID:</span> <span>${escape(profile.id || "Not available")}</span></div></div></div>`}</div> <div class="mb-12"><div class="flex justify-between items-center mb-6"><h2 class="text-2xl font-bold text-[#2A4D61]" data-svelte-h="svelte-ypldtb">My Courses</h2> ${validate_component(CourseFilter, "CourseFilter").$$render($$result, {}, {}, {})}</div> ${validate_component(CourseList, "CourseList").$$render(
    $$result,
    {
      courses: filteredCourses,
      loading,
      error,
      onShare: handleShareCourse
    },
    {},
    {}
  )}</div></div> ${showShareModal ? `${validate_component(ShareModal, "ShareModal").$$render(
    $$result,
    {
      show: showShareModal,
      courseId: selectedCourseId,
      onClose: () => showShareModal = false
    },
    {},
    {}
  )}` : ``}`;
});
export {
  Page as default
};
