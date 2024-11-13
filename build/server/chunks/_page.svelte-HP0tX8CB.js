import { c as create_ssr_component, v as validate_component, b as add_attribute, e as escape, a as subscribe, d as each } from './ssr-vuZdlTfL.js';
import './firebase-CTgjpWaB.js';
import './client-CnCRRyPd.js';
import { u as user } from './auth-kkRkzBXy.js';
import { l as loadingState, C as CourseGenerationProgress } from './CourseGenerationProgress-Dt_YjH5r.js';
import 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import './exports-CTha0ECg.js';
import './index2-DBzPtTNm.js';

const CourseGenerator = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { courseObjective } = $$props;
  let { loading: loading2 } = $$props;
  let { error } = $$props;
  let { onSubmit } = $$props;
  if ($$props.courseObjective === void 0 && $$bindings.courseObjective && courseObjective !== void 0) $$bindings.courseObjective(courseObjective);
  if ($$props.loading === void 0 && $$bindings.loading && loading2 !== void 0) $$bindings.loading(loading2);
  if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);
  if ($$props.onSubmit === void 0 && $$bindings.onSubmit && onSubmit !== void 0) $$bindings.onSubmit(onSubmit);
  return `<div class="max-w-2xl mx-auto"><div class="mb-6"><label for="objective" class="block text-lg mb-2" data-svelte-h="svelte-1ohawld">Enter your course objective</label> <input type="text" id="objective" class="w-full p-3 border rounded-lg" placeholder="e.g., Learn Python for Data Science" ${loading2 ? "disabled" : ""}${add_attribute("value", courseObjective, 0)}></div> ${error ? `<div class="text-red-500 mb-4">${escape(error)}</div>` : ``} <button ${loading2 || !courseObjective ? "disabled" : ""} class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">${escape(loading2 ? "Building..." : "Build My Course")}</button></div>`;
});
const YoutubeUrlInput = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { moduleIndex } = $$props;
  let { onVideoAdd } = $$props;
  let url = "";
  if ($$props.moduleIndex === void 0 && $$bindings.moduleIndex && moduleIndex !== void 0) $$bindings.moduleIndex(moduleIndex);
  if ($$props.onVideoAdd === void 0 && $$bindings.onVideoAdd && onVideoAdd !== void 0) $$bindings.onVideoAdd(onVideoAdd);
  return `<div class="mt-4"><div class="flex gap-2"><input type="text" placeholder="Paste YouTube URL" class="flex-1 p-2 border rounded" ${""}${add_attribute("value", url, 0)}> <button ${""} class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">${escape("Add")}</button></div> ${``}</div>`;
});
let generatedCourseId = null;
const VideoSelector = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_loadingState;
  let $$unsubscribe_user;
  $$unsubscribe_loadingState = subscribe(loadingState, (value) => value);
  $$unsubscribe_user = subscribe(user, (value) => value);
  let { courseStructure } = $$props;
  let { moduleVideos } = $$props;
  let { selectedVideos } = $$props;
  let { error } = $$props;
  const loading2 = false;
  let minimized = false;
  const getLoadingMessage = () => {
    if (!courseStructure) return "Building course structure...";
    return "Preparing your final course...";
  };
  if ($$props.courseStructure === void 0 && $$bindings.courseStructure && courseStructure !== void 0) $$bindings.courseStructure(courseStructure);
  if ($$props.moduleVideos === void 0 && $$bindings.moduleVideos && moduleVideos !== void 0) $$bindings.moduleVideos(moduleVideos);
  if ($$props.selectedVideos === void 0 && $$bindings.selectedVideos && selectedVideos !== void 0) $$bindings.selectedVideos(selectedVideos);
  if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);
  if ($$props.loading === void 0 && $$bindings.loading && loading2 !== void 0) $$bindings.loading(loading2);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `<div><h2 class="text-2xl font-bold mb-6">${escape(courseStructure.OG_Course_Title)}</h2> <p class="mb-8">${escape(courseStructure.OG_Course_Objective)}</p> ${each(courseStructure.OG_Module_Title, (moduleTitle, moduleIndex) => {
      return `<div class="mb-8 p-4 bg-gray-50 rounded-lg"><h3 class="text-xl font-semibold mb-2">Module ${escape(moduleIndex + 1)}: ${escape(moduleTitle)}</h3> ${moduleVideos[moduleIndex] ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-4">${each(moduleVideos[moduleIndex], (video, videoIndex) => {
        return `<div class="relative"><button class="${[
          "p-4 border rounded-lg hover:border-blue-500 transition-colors w-full text-left",
          selectedVideos[moduleIndex] === videoIndex ? "border-blue-500" : ""
        ].join(" ").trim()}"><div role="button" tabindex="0" class="relative cursor-pointer"><img${add_attribute("src", video.thumbnailUrl, 0)}${add_attribute("alt", video.title, 0)} class="w-full h-48 object-cover mb-2 rounded"> <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity" data-svelte-h="svelte-1qjeg74"><svg class="w-16 h-16 text-white opacity-0 hover:opacity-100" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg> </div></div> <div role="button" tabindex="0" class="mt-2"><h4 class="font-semibold mb-1">${escape(video.title)}</h4> <p class="text-sm text-gray-600">${escape(video.length)} minutes</p> </div></button> </div>`;
      })}</div> ${``} ${validate_component(YoutubeUrlInput, "YoutubeUrlInput").$$render(
        $$result,
        {
          moduleIndex,
          onVideoAdd: (video, index) => {
            moduleVideos[index] = [...moduleVideos[index], video];
            moduleVideos = [...moduleVideos];
          }
        },
        {},
        {}
      )}` : `<div class="text-center py-4">${escape(getLoadingMessage())} </div>`} </div>`;
    })}</div> <div class="mt-8 flex justify-end"><button ${selectedVideos.some((v) => v === void 0) ? "disabled" : ""} class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">${escape("Generate Final Course")}</button></div> ${validate_component(CourseGenerationProgress, "CourseGenerationProgress").$$render(
      $$result,
      { courseId: generatedCourseId, minimized },
      {
        minimized: ($$value) => {
          minimized = $$value;
          $$settled = false;
        }
      },
      {}
    )}`;
  } while (!$$settled);
  $$unsubscribe_loadingState();
  $$unsubscribe_user();
  return $$rendered;
});
let loading = false;
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let courseObjective = "";
  let courseStructure = null;
  let error = null;
  let moduleVideos = [];
  let selectedVideos = [];
  async function handleBuildCourse() {
    loadingState.startLoading("", true);
    error = null;
    moduleVideos = [];
    selectedVideos = [];
    try {
      const response = await fetch("/api/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseInput: courseObjective })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate course");
      }
      courseStructure = data.courseStructure;
      loadingState.setTotalModules(courseStructure.OG_Module_Title.length);
      selectedVideos = new Array(courseStructure.OG_Module_Title.length).fill(0);
    } catch (err) {
      console.error("Error building course:", err);
      error = err.message;
      courseStructure = null;
    } finally {
      loadingState.stopLoading();
    }
  }
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `<div class="container mx-auto px-4 py-8"><h1 class="text-3xl font-bold mb-8" data-svelte-h="svelte-18htr2l">Create Your Course</h1> ${!courseStructure ? `${validate_component(CourseGenerator, "CourseGenerator").$$render(
      $$result,
      {
        loading,
        error,
        onSubmit: handleBuildCourse,
        courseObjective
      },
      {
        courseObjective: ($$value) => {
          courseObjective = $$value;
          $$settled = false;
        }
      },
      {}
    )}` : `${validate_component(VideoSelector, "VideoSelector").$$render(
      $$result,
      {
        courseStructure,
        loading,
        error,
        moduleVideos,
        selectedVideos
      },
      {
        moduleVideos: ($$value) => {
          moduleVideos = $$value;
          $$settled = false;
        },
        selectedVideos: ($$value) => {
          selectedVideos = $$value;
          $$settled = false;
        }
      },
      {}
    )}`}</div>`;
  } while (!$$settled);
  return $$rendered;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-HP0tX8CB.js.map
