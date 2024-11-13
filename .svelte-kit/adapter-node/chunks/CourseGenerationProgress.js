import { c as create_ssr_component, a as subscribe } from "./ssr.js";
import { w as writable } from "./index2.js";
import "./client.js";
const getInitialState = () => {
  return {
    isLoading: false,
    currentModule: 0,
    totalModules: 10,
    currentModuleTitle: "",
    currentStep: "",
    progress: 0,
    courseTitle: "",
    minimized: false,
    courseId: null,
    isInitialBuild: false,
    error: null
  };
};
const createLoadingStore = () => {
  const { subscribe: subscribe2, set, update } = writable(getInitialState());
  return {
    subscribe: subscribe2,
    startLoading: (courseTitle = "", isInitialBuild = false) => update((state) => ({
      ...state,
      isLoading: true,
      currentModule: 0,
      progress: 0,
      courseTitle,
      isInitialBuild
    })),
    stopLoading: (courseId = null) => update((state) => ({
      ...state,
      isLoading: false,
      currentModule: 0,
      currentStep: "",
      progress: 100,
      courseId
    })),
    setMinimized: (minimized) => update((state) => ({ ...state, minimized })),
    clearState: () => {
      set(getInitialState());
    },
    setCurrentModule: (module, title = "") => update((state) => ({
      ...state,
      currentModule: module,
      currentModuleTitle: title
    })),
    setStep: (step) => update((state) => ({
      ...state,
      currentStep: step
    })),
    setProgress: (progress) => update((state) => ({
      ...state,
      progress: Math.min(Math.max(progress, 0), 100)
    })),
    setTotalModules: (total) => update((state) => ({ ...state, totalModules: total })),
    setError: (error) => update((state) => ({
      ...state,
      error,
      isLoading: error ? true : state.isLoading
    })),
    clearError: () => update((state) => ({ ...state, error: null }))
  };
};
const loadingState = createLoadingStore();
const CourseGenerationProgress = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_loadingState;
  $$unsubscribe_loadingState = subscribe(loadingState, (value) => value);
  $$unsubscribe_loadingState();
  return `${`${``}`}`;
});
export {
  CourseGenerationProgress as C,
  loadingState as l
};
