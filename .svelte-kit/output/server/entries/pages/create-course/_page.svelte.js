import { J as attr, I as escape_html, K as bind_props, z as push, B as pop, L as ensure_array_like, M as stringify, N as copy_payload, O as assign_payload } from "../../../chunks/index.js";
import "../../../chunks/auth.js";
import "../../../chunks/client.js";
function CourseGenerator($$payload, $$props) {
  let courseObjective = $$props["courseObjective"];
  let loading = $$props["loading"];
  let error = $$props["error"];
  let onSubmit = $$props["onSubmit"];
  $$payload.out += `<div class="max-w-2xl mx-auto"><div class="mb-6"><label for="objective" class="block text-lg mb-2">Enter your course objective</label> <textarea id="objective" class="w-full p-3 border rounded-lg min-h-[120px]" placeholder="e.g., Learn Python for Data Science"${attr("disabled", loading, true)}>`;
  const $$body = escape_html(courseObjective);
  if ($$body) {
    $$payload.out += `${$$body}`;
  }
  $$payload.out += `</textarea></div> `;
  if (error) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="text-red-500 mb-4">${escape_html(error)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <button${attr("disabled", loading || !courseObjective, true)} class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">${escape_html(loading ? "Building..." : "Build My Course")}</button></div>`;
  bind_props($$props, { courseObjective, loading, error, onSubmit });
}
function YoutubeUrlInput($$payload, $$props) {
  push();
  let moduleIndex = $$props["moduleIndex"];
  let onVideoAdd = $$props["onVideoAdd"];
  let url = "";
  let loading = false;
  $$payload.out += `<div class="mt-4"><div class="flex gap-2"><input type="text"${attr("value", url)} placeholder="Paste YouTube URL" class="flex-1 p-2 border rounded"${attr("disabled", loading, true)}> <button${attr("disabled", loading, true)} class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">${escape_html("Add")}</button></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { moduleIndex, onVideoAdd });
  pop();
}
function VideoSelector($$payload, $$props) {
  push();
  let courseStructure = $$props["courseStructure"];
  let moduleVideos = $$props["moduleVideos"];
  let selectedVideos = $$props["selectedVideos"];
  let error = $$props["error"];
  const loading = false;
  const getLoadingMessage = () => {
    if (!courseStructure) return "Building course structure...";
    return "Preparing your final course...";
  };
  const each_array = ensure_array_like(courseStructure.OG_Module_Title);
  $$payload.out += `<div><h2 class="text-2xl font-bold mb-6">${escape_html(courseStructure.OG_Course_Title)}</h2> <p class="mb-8">${escape_html(courseStructure.OG_Course_Objective)}</p> <!--[-->`;
  for (let moduleIndex = 0, $$length = each_array.length; moduleIndex < $$length; moduleIndex++) {
    let moduleTitle = each_array[moduleIndex];
    $$payload.out += `<div class="mb-8 p-4 bg-gray-50 rounded-lg"><h3 class="text-xl font-semibold mb-2">Module ${escape_html(moduleIndex + 1)}: ${escape_html(moduleTitle)}</h3> `;
    if (moduleVideos[moduleIndex]) {
      $$payload.out += "<!--[-->";
      const each_array_1 = ensure_array_like(moduleVideos[moduleIndex]);
      $$payload.out += `<div class="grid grid-cols-1 md:grid-cols-3 gap-4"><!--[-->`;
      for (let videoIndex = 0, $$length2 = each_array_1.length; videoIndex < $$length2; videoIndex++) {
        let video = each_array_1[videoIndex];
        $$payload.out += `<div class="relative"><button${attr("class", `p-4 border rounded-lg hover:border-blue-500 transition-colors w-full text-left ${stringify([
          selectedVideos[moduleIndex] === videoIndex ? "border-blue-500" : ""
        ].filter(Boolean).join(" "))}`)}><div role="button" tabindex="0" class="relative cursor-pointer"><img${attr("src", video.thumbnailUrl)}${attr("alt", video.title)} class="w-full h-48 object-cover mb-2 rounded"> <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity"><svg class="w-16 h-16 text-white opacity-0 hover:opacity-100" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg></div></div> <div role="button" tabindex="0" class="mt-2"><h4 class="font-semibold mb-1">${escape_html(video.title)}</h4> <p class="text-sm text-gray-600">${escape_html(video.length)} minutes</p></div></button></div>`;
      }
      $$payload.out += `<!--]--></div> `;
      {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      YoutubeUrlInput($$payload, {
        moduleIndex,
        onVideoAdd: (video, index) => {
          moduleVideos[index] = [...moduleVideos[index], video];
          moduleVideos = [...moduleVideos];
        }
      });
      $$payload.out += `<!---->`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<div class="text-center py-4">${escape_html(getLoadingMessage())}</div>`;
    }
    $$payload.out += `<!--]--></div>`;
  }
  $$payload.out += `<!--]--></div> <div class="mt-8 flex justify-end"><button${attr("disabled", selectedVideos.some((v) => v === void 0), true)} class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">${escape_html("Save Course")}</button></div>`;
  bind_props($$props, {
    courseStructure,
    moduleVideos,
    selectedVideos,
    error,
    loading
  });
  pop();
}
function _page($$payload, $$props) {
  push();
  let courseObjective = "";
  let courseStructure = null;
  let loading = false;
  let error = null;
  let moduleVideos = [];
  let selectedVideos = [];
  async function handleBuildCourse() {
    loading = true;
    error = null;
    moduleVideos = [];
    selectedVideos = [];
    try {
      const response = await fetch("/api/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cross-Origin-Opener-Policy": "same-origin"
        },
        body: JSON.stringify({ objective: courseObjective })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate course");
      }
      courseStructure = await response.json();
      selectedVideos = new Array(courseStructure.OG_Module_Title.length).fill(0);
    } catch (err) {
      console.error("Error building course:", err);
      error = err.message;
      courseStructure = null;
    } finally {
      loading = false;
    }
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div class="container mx-auto px-4 py-8"><h1 class="text-3xl font-bold mb-8">Create Your Course</h1> `;
    if (!courseStructure) {
      $$payload2.out += "<!--[-->";
      CourseGenerator($$payload2, {
        get courseObjective() {
          return courseObjective;
        },
        set courseObjective($$value) {
          courseObjective = $$value;
          $$settled = false;
        },
        loading,
        error,
        onSubmit: handleBuildCourse
      });
    } else {
      $$payload2.out += "<!--[!-->";
      VideoSelector($$payload2, {
        courseStructure,
        get moduleVideos() {
          return moduleVideos;
        },
        set moduleVideos($$value) {
          moduleVideos = $$value;
          $$settled = false;
        },
        get selectedVideos() {
          return selectedVideos;
        },
        set selectedVideos($$value) {
          selectedVideos = $$value;
          $$settled = false;
        },
        loading,
        error
      });
    }
    $$payload2.out += `<!--]--></div>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
export {
  _page as default
};
