import { c as create_ssr_component, v as validate_component, a as subscribe, d as add_attribute, e as each, b as escape } from "../../chunks/ssr.js";
import { u as user } from "../../chunks/auth.js";
import "../../chunks/auth2.js";
import "../../chunks/client.js";
import { g as getUserCourses } from "../../chunks/firebase.js";
import { C as CourseFilter, a as CourseList, S as Skeleton, b as ShareModal } from "../../chunks/CourseList.js";
import { I as Icon } from "../../chunks/Icon.js";
const Arrow_right = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [["path", { "d": "M5 12h14" }], ["path", { "d": "m12 5 7 7-7 7" }]];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "arrow-right" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Eye = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
      }
    ],
    ["circle", { "cx": "12", "cy": "12", "r": "3" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "eye" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Thumbs_down = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "M17 14V2" }],
    [
      "path",
      {
        "d": "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "thumbs-down" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Thumbs_up = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "M7 10v12" }],
    [
      "path",
      {
        "d": "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "thumbs-up" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
function getSkeletonItems(count) {
  return Array(count).fill(null);
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $user, $$unsubscribe_user;
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  let learningObjective = "";
  let userCourses = [];
  let loading = false;
  let error = null;
  let filteredCourses = [];
  let showShareModal = false;
  let selectedCourseId = "";
  async function loadUserCourses() {
    try {
      loading = true;
      error = null;
      const courses = await getUserCourses($user.uid);
      userCourses = courses;
      filteredCourses = [...courses];
    } catch (err) {
      console.error("Error loading courses:", err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  const trendingCourses = [
    {
      id: 1,
      title: "Blockchain Fundamentals",
      author: "Crypto Expert",
      image: "/placeholder.svg",
      likes: 1200,
      dislikes: 50,
      views: 15e3
    },
    {
      id: 2,
      title: "AI and Machine Learning",
      author: "Data Scientist Pro",
      image: "/placeholder.svg",
      likes: 980,
      dislikes: 30,
      views: 12e3
    },
    {
      id: 3,
      title: "Full Stack Web Development",
      author: "Code Ninja",
      image: "/placeholder.svg",
      likes: 850,
      dislikes: 20,
      views: 1e4
    }
  ];
  function handleShareCourse(courseId) {
    selectedCourseId = courseId;
    showShareModal = true;
  }
  {
    {
      if (userCourses) {
        filteredCourses = [...userCourses];
      }
    }
  }
  {
    if ($user) {
      loadUserCourses();
    }
  }
  $$unsubscribe_user();
  return `<div class="container mx-auto px-4 py-6 pb-20 sm:pb-6 sm:py-8 max-w-7xl"> <div class="relative overflow-hidden bg-gradient-to-br from-[#F5F5F5] to-white rounded-lg shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12"><div class="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5"></div> <div class="max-w-2xl mx-auto text-center relative"><div class="flex items-center justify-center mb-4 sm:mb-6" data-svelte-h="svelte-u801bu"><img src="/favicon.png" alt="Youversity Logo" class="w-8 h-8 sm:w-12 sm:h-12 object-contain"></div> <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2A4D61] mb-2 sm:mb-4" data-svelte-h="svelte-mty9d9">Create Your Course</h2> <p class="text-sm sm:text-base text-[#1E3443]/80 mb-6 sm:mb-8" data-svelte-h="svelte-r3sagf">Enter your learning objective below and we&#39;ll help you create a comprehensive course</p> <form class="flex flex-col sm:flex-row gap-2 sm:gap-4 max-w-xl mx-auto"><input type="text" placeholder="Enter what you want to learn..." class="flex-1 px-4 py-2 sm:py-3 rounded-lg border border-[#D9E1E3] focus:outline-none focus:ring-2 focus:ring-[#EE434A] text-sm sm:text-base"${add_attribute("value", learningObjective, 0)}> <button type="submit" class="px-6 py-2 sm:py-3 bg-[#EE434A] text-white rounded-lg hover:bg-[#D63B42] transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap">Create Course
          ${validate_component(Arrow_right, "ArrowRight").$$render($$result, { class: "w-4 h-4 sm:w-5 sm:h-5" }, {}, {})}</button></form></div></div> ${$user ? `<div class="mb-8"><div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><h2 class="text-xl sm:text-2xl font-semibold text-[#2A4D61]" data-svelte-h="svelte-14dzlku">Your Courses</h2> <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">${validate_component(CourseFilter, "CourseFilter").$$render($$result, {}, {}, {})}</div></div> ${loading ? `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">${each(getSkeletonItems(6), (_) => {
    return `<div class="bg-white rounded-lg shadow-md overflow-hidden p-4">${validate_component(Skeleton, "Skeleton").$$render($$result, { height: "200px", class: "mb-4" }, {}, {})} ${validate_component(Skeleton, "Skeleton").$$render(
      $$result,
      {
        height: "24px",
        width: "70%",
        class: "mb-2"
      },
      {},
      {}
    )} ${validate_component(Skeleton, "Skeleton").$$render(
      $$result,
      {
        height: "20px",
        width: "40%",
        class: "mb-4"
      },
      {},
      {}
    )} <div class="flex justify-between">${validate_component(Skeleton, "Skeleton").$$render($$result, { height: "20px", width: "30%" }, {}, {})} ${validate_component(Skeleton, "Skeleton").$$render($$result, { height: "20px", width: "30%" }, {}, {})}</div> </div>`;
  })}</div>` : `${validate_component(CourseList, "CourseList").$$render(
    $$result,
    {
      courses: filteredCourses,
      loading,
      error,
      onShare: handleShareCourse
    },
    {},
    {}
  )}`}</div>  <section class="mb-12"><h2 class="text-xl sm:text-2xl font-semibold text-[#2A4D61] mb-6" data-svelte-h="svelte-s7abia">Trending Courses</h2> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">${each(trendingCourses, (course) => {
    return `<div class="bg-white rounded-lg shadow-md overflow-hidden"><img${add_attribute("src", course.image, 0)}${add_attribute("alt", course.title, 0)} class="w-full h-32 sm:h-48 object-cover" loading="lazy"> <div class="p-4"><h3 class="font-semibold text-base sm:text-lg text-[#2A4D61] mb-2">${escape(course.title)}</h3> <p class="text-sm text-[#1E3443]/80 mb-4">${escape(course.author)}</p> <div class="flex items-center justify-between text-sm"><div class="flex items-center gap-4"><span class="flex items-center gap-1">${validate_component(Thumbs_up, "ThumbsUp").$$render($$result, { class: "w-4 h-4" }, {}, {})} ${escape(course.likes)}</span> <span class="flex items-center gap-1">${validate_component(Thumbs_down, "ThumbsDown").$$render($$result, { class: "w-4 h-4" }, {}, {})} ${escape(course.dislikes)} </span></div> <span class="flex items-center gap-1">${validate_component(Eye, "Eye").$$render($$result, { class: "w-4 h-4" }, {}, {})} ${escape(course.views)}</span> </div></div> </div>`;
  })}</div></section>` : ``}</div> ${showShareModal ? `${validate_component(ShareModal, "ShareModal").$$render(
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
