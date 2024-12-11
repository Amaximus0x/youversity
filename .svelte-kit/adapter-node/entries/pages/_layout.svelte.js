import { c as create_ssr_component, a as subscribe, v as validate_component, e as each, b as escape, d as add_attribute, m as missing_component } from "../../chunks/ssr.js";
import { p as page } from "../../chunks/stores.js";
import { u as user } from "../../chunks/auth.js";
import "../../chunks/auth2.js";
import { w as writable } from "../../chunks/index2.js";
import "../../chunks/client.js";
import { I as Icon } from "../../chunks/Icon.js";
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
    error: null,
    isCreateCourse: false
  };
};
const createLoadingStore = () => {
  const { subscribe: subscribe2, set, update } = writable(getInitialState());
  return {
    subscribe: subscribe2,
    startLoading: (courseTitle = "", isInitialBuild = false, isCreateCourse = false) => update((state) => ({
      ...state,
      isLoading: true,
      currentModule: 0,
      progress: 0,
      courseTitle,
      isInitialBuild,
      isCreateCourse
    })),
    stopLoading: (courseId = null) => update((state) => ({
      ...state,
      isLoading: false,
      currentModule: 0,
      currentStep: "",
      progress: 100,
      courseId,
      isCreateCourse: false
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
  return `${``}`;
});
const Bell = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
      }
    ],
    ["path", { "d": "M10.3 21a1.94 1.94 0 0 0 3.4 0" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "bell" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const House = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
      }
    ],
    [
      "path",
      {
        "d": "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "house" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Log_out = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      }
    ],
    ["polyline", { "points": "16 17 21 12 16 7" }],
    [
      "line",
      {
        "x1": "21",
        "x2": "9",
        "y1": "12",
        "y2": "12"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "log-out" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Search = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["circle", { "cx": "11", "cy": "11", "r": "8" }],
    ["path", { "d": "m21 21-4.3-4.3" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "search" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Settings = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      }
    ],
    ["circle", { "cx": "12", "cy": "12", "r": "3" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "settings" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Trending_up = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["polyline", { "points": "22 7 13.5 15.5 8.5 10.5 2 17" }],
    ["polyline", { "points": "16 7 22 7 22 13" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "trending-up" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const User = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
      }
    ],
    ["circle", { "cx": "12", "cy": "7", "r": "4" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "user" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const css = {
  code: "body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale\n}",
  map: `{"version":3,"file":"+layout.svelte","sources":["+layout.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { page } from \\"$app/stores\\";\\nimport { user, isAuthenticated } from \\"$lib/stores/auth\\";\\nimport { signInWithGoogle, signOutUser } from \\"$lib/services/auth\\";\\nimport CourseGenerationProgress from \\"$lib/components/CourseGenerationProgress.svelte\\";\\nimport Skeleton from \\"$lib/components/Skeleton.svelte\\";\\nimport {\\n  Home,\\n  TrendingUp,\\n  Settings,\\n  LogOut,\\n  Search,\\n  Bell,\\n  PlusCircle,\\n  User,\\n  Plus\\n} from \\"lucide-svelte\\";\\nimport \\"../app.css\\";\\nimport { goto } from \\"$app/navigation\\";\\nimport NoInternet from \\"$lib/components/NoInternet.svelte\\";\\nimport { onMount } from \\"svelte\\";\\nconst sidebarItems = [\\n  { icon: Home, label: \\"Home\\", href: \\"/\\", isActive: true },\\n  { icon: TrendingUp, label: \\"Trending\\", href: \\"/trending\\", isActive: false },\\n  { icon: User, label: \\"My Profile\\", href: \\"/profile\\", isActive: false },\\n  { icon: Settings, label: \\"Settings\\", href: \\"/settings\\", isActive: false }\\n];\\nconst mobileNavItems = [\\n  { icon: Home, label: \\"Home\\", href: \\"/\\" },\\n  { icon: TrendingUp, label: \\"Trending\\", href: \\"/trending\\" },\\n  { icon: User, label: \\"Profile\\", href: \\"/profile\\" },\\n  { icon: Settings, label: \\"Settings\\", href: \\"/settings\\" }\\n];\\nlet menuOpen = false;\\nlet searchQuery = \\"\\";\\nlet isOnline = true;\\nfunction toggleMenu() {\\n  menuOpen = !menuOpen;\\n}\\nasync function handleAuth() {\\n  if ($user) {\\n    await signOutUser();\\n  } else {\\n    await signInWithGoogle();\\n  }\\n}\\nfunction handleAddCourse() {\\n  goto(\\"/create-course\\");\\n}\\nfunction updateOnlineStatus() {\\n  isOnline = navigator.onLine;\\n}\\nonMount(() => {\\n  updateOnlineStatus();\\n  window.addEventListener(\\"online\\", updateOnlineStatus);\\n  window.addEventListener(\\"offline\\", updateOnlineStatus);\\n  if (\\"serviceWorker\\" in navigator) {\\n    navigator.serviceWorker.register(\\"/service-worker.js\\").then((registration) => {\\n      console.log(\\"ServiceWorker registration successful\\");\\n    }).catch((err) => {\\n      console.error(\\"ServiceWorker registration failed:\\", err);\\n    });\\n  }\\n  return () => {\\n    window.removeEventListener(\\"online\\", updateOnlineStatus);\\n    window.removeEventListener(\\"offline\\", updateOnlineStatus);\\n  };\\n});\\n<\/script>\\r\\n\\r\\n{#if !isOnline}\\r\\n  <div class=\\"fixed inset-0 z-50\\">\\r\\n    <NoInternet />\\r\\n  </div>\\r\\n{:else}\\r\\n  <div class=\\"min-h-screen bg-[#F5F5F5] font-sans\\">\\r\\n    <div class=\\"flex\\">\\r\\n      <!-- Sidebar - hidden on mobile -->\\r\\n      <aside class=\\"hidden md:block w-64 bg-white h-screen sticky top-0 border-r border-[#E8EAED] z-10\\">\\r\\n        <div class=\\"flex items-center h-16 px-6 border-b border-[#E8EAED]\\">\\r\\n          <a href=\\"/\\" class=\\"flex items-center space-x-3\\">\\r\\n            <img \\r\\n              src=\\"/favicon.png\\" \\r\\n              alt=\\"Youversity Logo\\" \\r\\n              class=\\"w-7 h-7 object-contain\\"\\r\\n            />\\r\\n            <span class=\\"text-[15px] font-medium text-[#202124]\\">YouVersity</span>\\r\\n          </a>\\r\\n        </div>\\r\\n\\r\\n        <nav class=\\"py-2\\">\\r\\n          {#each sidebarItems as item}\\r\\n            <a \\r\\n              href={item.href} \\r\\n              class=\\"flex items-center mx-2 px-4 h-[44px] transition-colors rounded-full {\\r\\n                $page.url.pathname === item.href \\r\\n                  ? 'bg-[#E8F0FE] text-[#EE434A]' \\r\\n                  : 'text-[#5F6368] hover:bg-[#F8F9FA]'\\r\\n              }\\"\\r\\n            >\\r\\n              <svelte:component \\r\\n                this={item.icon} \\r\\n                class=\\"{\\r\\n                  $page.url.pathname === item.href\\r\\n                    ? 'text-[#EE434A]'\\r\\n                    : 'text-[#5F6368]'\\r\\n                } w-[20px] h-[20px] mr-3\\" \\r\\n              />\\r\\n              <span class=\\"text-[14px] font-medium\\">{item.label}</span>\\r\\n            </a>\\r\\n          {/each}\\r\\n        </nav>\\r\\n\\r\\n        <div class=\\"absolute bottom-0 w-full border-t border-[#E8EAED]\\">\\r\\n          <button \\r\\n            on:click={handleAuth}\\r\\n            class=\\"flex items-center w-full mx-2 px-4 h-[44px] text-[#5F6368] hover:bg-[#F8F9FA] rounded-full my-2\\"\\r\\n          >\\r\\n            <LogOut class=\\"w-[20px] h-[20px] mr-3\\" />\\r\\n            <span class=\\"text-[14px] font-medium\\">{$user ? 'Sign Out' : 'Sign In'}</span>\\r\\n          </button>\\r\\n        </div>\\r\\n      </aside>\\r\\n\\r\\n      <!-- Main Content -->\\r\\n      <main class=\\"flex-1 pb-16 md:pb-0\\">\\r\\n        <!-- Header -->\\r\\n        <header class=\\"bg-white border-b border-[#E8EAED] px-6 h-16 flex justify-between items-center fixed top-0 right-0 w-[calc(100%-16rem)] z-20\\">\\r\\n          <div class=\\"relative w-1/2\\">\\r\\n            <input\\r\\n              type=\\"text\\"\\r\\n              placeholder=\\"Search courses...\\"\\r\\n              bind:value={searchQuery}\\r\\n              class=\\"w-full pl-10 py-2 pr-4 rounded-lg bg-[#F5F5F5] border-none focus:outline-none focus:ring-2 focus:ring-[#EE434A] text-sm\\"\\r\\n            />\\r\\n            <Search class=\\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5\\" />\\r\\n          </div>\\r\\n\\r\\n          <div class=\\"flex items-center space-x-6\\">\\r\\n            <button class=\\"relative p-2 hover:bg-[#F5F5F5] rounded-full\\">\\r\\n              <Bell class=\\"w-5 h-5 text-[#2A4D61]\\" />\\r\\n              <span class=\\"absolute top-1 right-1 w-2 h-2 bg-[#42C1C8] rounded-full\\"></span>\\r\\n            </button>\\r\\n            \\r\\n            {#if $user}\\r\\n              <div class=\\"w-8 h-8 rounded-full bg-gray-200 overflow-hidden\\">\\r\\n                <img \\r\\n                  src={$user.photoURL || ''} \\r\\n                  alt={$user.displayName || 'User'} \\r\\n                  class=\\"w-full h-full object-cover\\"\\r\\n                />\\r\\n              </div>\\r\\n            {/if}\\r\\n          </div>\\r\\n        </header>\\r\\n\\r\\n        <!-- Page Content -->\\r\\n        <div class=\\"p-8 mt-16\\">\\r\\n          <slot />\\r\\n        </div>\\r\\n      </main>\\r\\n    </div>\\r\\n\\r\\n    <!-- Mobile Bottom Navigation -->\\r\\n    <nav class=\\"md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200\\">\\r\\n      <div class=\\"flex justify-around items-center h-16\\">\\r\\n        {#each mobileNavItems as item}\\r\\n          <a \\r\\n            href={item.href}\\r\\n            class=\\"flex flex-col items-center justify-center flex-1 h-full text-xs py-1\\r\\n              {$page.url.pathname === item.href \\r\\n                ? 'text-[#EE434A]' \\r\\n                : 'text-[#2A4D61]'}\\"\\r\\n          >\\r\\n            <svelte:component \\r\\n              this={item.icon} \\r\\n              class=\\"w-6 h-6 mb-1\\" \\r\\n            />\\r\\n            <span>{item.label}</span>\\r\\n          </a>\\r\\n        {/each}\\r\\n      </div>\\r\\n    </nav>\\r\\n  </div>\\r\\n{/if}\\r\\n\\r\\n<CourseGenerationProgress />\\r\\n\\r\\n<style>\\r\\n  :global(body) {\\n    -webkit-font-smoothing: antialiased;\\n    -moz-osx-font-smoothing: grayscale\\n}\\r\\n</style>"],"names":[],"mappings":"AA4LU,IAAM,CACZ,sBAAsB,CAAE,WAAW,CACnC,uBAAuB,CAAE;AAC7B"}`
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $user, $$unsubscribe_user;
  let $page, $$unsubscribe_page;
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const sidebarItems = [
    {
      icon: House,
      label: "Home",
      href: "/",
      isActive: true
    },
    {
      icon: Trending_up,
      label: "Trending",
      href: "/trending",
      isActive: false
    },
    {
      icon: User,
      label: "My Profile",
      href: "/profile",
      isActive: false
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
      isActive: false
    }
  ];
  const mobileNavItems = [
    { icon: House, label: "Home", href: "/" },
    {
      icon: Trending_up,
      label: "Trending",
      href: "/trending"
    },
    {
      icon: User,
      label: "Profile",
      href: "/profile"
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings"
    }
  ];
  let searchQuery = "";
  $$result.css.add(css);
  $$unsubscribe_user();
  $$unsubscribe_page();
  return `${`<div class="min-h-screen bg-[#F5F5F5] font-sans"><div class="flex"> <aside class="hidden md:block w-64 bg-white h-screen sticky top-0 border-r border-[#E8EAED] z-10"><div class="flex items-center h-16 px-6 border-b border-[#E8EAED]" data-svelte-h="svelte-1pi4nwo"><a href="/" class="flex items-center space-x-3"><img src="/favicon.png" alt="Youversity Logo" class="w-7 h-7 object-contain"> <span class="text-[15px] font-medium text-[#202124]">YouVersity</span></a></div> <nav class="py-2">${each(sidebarItems, (item) => {
    return `<a${add_attribute("href", item.href, 0)} class="${"flex items-center mx-2 px-4 h-[44px] transition-colors rounded-full " + escape(
      $page.url.pathname === item.href ? "bg-[#E8F0FE] text-[#EE434A]" : "text-[#5F6368] hover:bg-[#F8F9FA]",
      true
    )}">${validate_component(item.icon || missing_component, "svelte:component").$$render(
      $$result,
      {
        class: ($page.url.pathname === item.href ? "text-[#EE434A]" : "text-[#5F6368]") + " w-[20px] h-[20px] mr-3"
      },
      {},
      {}
    )} <span class="text-[14px] font-medium">${escape(item.label)}</span> </a>`;
  })}</nav> <div class="absolute bottom-0 w-full border-t border-[#E8EAED]"><button class="flex items-center w-full mx-2 px-4 h-[44px] text-[#5F6368] hover:bg-[#F8F9FA] rounded-full my-2">${validate_component(Log_out, "LogOut").$$render($$result, { class: "w-[20px] h-[20px] mr-3" }, {}, {})} <span class="text-[14px] font-medium">${escape($user ? "Sign Out" : "Sign In")}</span></button></div></aside>  <main class="flex-1 pb-16 md:pb-0"> <header class="bg-white border-b border-[#E8EAED] px-6 h-16 flex justify-between items-center fixed top-0 right-0 w-[calc(100%-16rem)] z-20"><div class="relative w-1/2"><input type="text" placeholder="Search courses..." class="w-full pl-10 py-2 pr-4 rounded-lg bg-[#F5F5F5] border-none focus:outline-none focus:ring-2 focus:ring-[#EE434A] text-sm"${add_attribute("value", searchQuery, 0)}> ${validate_component(Search, "Search").$$render(
    $$result,
    {
      class: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
    },
    {},
    {}
  )}</div> <div class="flex items-center space-x-6"><button class="relative p-2 hover:bg-[#F5F5F5] rounded-full">${validate_component(Bell, "Bell").$$render($$result, { class: "w-5 h-5 text-[#2A4D61]" }, {}, {})} <span class="absolute top-1 right-1 w-2 h-2 bg-[#42C1C8] rounded-full"></span></button> ${$user ? `<div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden"><img${add_attribute("src", $user.photoURL || "", 0)}${add_attribute("alt", $user.displayName || "User", 0)} class="w-full h-full object-cover"></div>` : ``}</div></header>  <div class="p-8 mt-16">${slots.default ? slots.default({}) : ``}</div></main></div>  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200"><div class="flex justify-around items-center h-16">${each(mobileNavItems, (item) => {
    return `<a${add_attribute("href", item.href, 0)} class="${"flex flex-col items-center justify-center flex-1 h-full text-xs py-1 " + escape(
      $page.url.pathname === item.href ? "text-[#EE434A]" : "text-[#2A4D61]",
      true
    )}">${validate_component(item.icon || missing_component, "svelte:component").$$render($$result, { class: "w-6 h-6 mb-1" }, {}, {})} <span>${escape(item.label)}</span> </a>`;
  })}</div></nav></div>`} ${validate_component(CourseGenerationProgress, "CourseGenerationProgress").$$render($$result, {}, {}, {})}`;
});
export {
  Layout as default
};
