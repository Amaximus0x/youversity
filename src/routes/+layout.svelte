<script lang="ts">
  import { page } from "$app/stores";
  import { user, isAuthenticated } from "$lib/stores/auth";
  import { signOutUser } from "$lib/services/auth";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import { theme } from "$lib/stores/theme";
  import "../app.css";
  import { goto } from "$app/navigation";
  import NoInternet from "$lib/components/NoInternet.svelte";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import FilterModal from "$lib/components/FilterModal.svelte";
  import {
    saveRecentSearch,
    getRecentSearches,
    clearRecentSearches,
    getSearchRecommendations,
  } from "$lib/services/search";
  import CourseGenerationModal from "$lib/components/CourseGenerationModal.svelte";
  import { loadingState } from "$lib/stores/loadingState";
  import { modalState } from "$lib/stores/modalState";
  import { browser } from "$app/environment";

  // State variables
  let isSearchPage = false;
  let isMounted = false;
  let showFilterModal = false;
  let currentFilter: "relevance" | "latest" = "relevance";
  let activeFilterCount = 0;
  let showMobileSearch = false;
  let menuOpen = false;
  let searchQuery = "";
  let isOnline = true;
  let isSearchFocused = false;
  let prevPath = "";

  // Initialize search-related arrays
  let recentSearches: Array<{ query: string; timestamp: number }> = [];
  let recommendations: string[] = [];

  // Sidebar items configuration
  const sidebarItems = [
    { icon: "/icons/home.svg", label: "Home", href: "/", isActive: true },
    {
      icon: "/icons/fire-02.svg",
      label: "Trending",
      href: "/trending",
      isActive: false,
    },
    {
      icon: "/icons/video-replay.svg",
      label: "My Courses",
      href: "/my-courses",
      isActive: false,
    },
    {
      icon: "/icons/bookmark-03.svg",
      label: "Bookmarks",
      href: "/bookmarks",
      isActive: false,
    },
    {
      icon: "/icons/settings-02.svg",
      label: "Settings",
      href: "/settings",
      isActive: false,
    },
  ];

  // Mobile navigation items
  const mobileNavItems = [
    { icon: "/icons/home.svg", label: "Home", href: "/" },
    { icon: "/icons/fire-02.svg", label: "Trending", href: "/trending" },
    {
      icon: "/icons/video-replay.svg",
      label: "My Courses",
      href: "/my-courses",
    },
    { icon: "/icons/bookmark-03.svg", label: "Bookmarks", href: "/bookmarks" },
    { icon: "/icons/settings-02.svg", label: "Settings", href: "/settings" },
  ];

  // Add this function to handle clicks outside the search area
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest("form")) {
      isSearchFocused = false;
    }
  }

  // Load data on mount
  onMount(async () => {
    isMounted = true;
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Load recent searches
    recentSearches = getRecentSearches();

    // Load recommendations
    try {
      recommendations = await getSearchRecommendations();
    } catch (error) {
      console.error("Error loading recommendations:", error);
      recommendations = [];
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registration successful");
        })
        .catch((err) => {
          console.error("ServiceWorker registration failed:", err);
        });
    }

    // Add click event listener for handling clicks outside search
    document.addEventListener("click", handleClickOutside);

    if (browser) {
      // Restore states from localStorage if needed
      const storedLoadingState = localStorage.getItem("loadingState");
      const storedModalState = localStorage.getItem("modalState");

      if (storedLoadingState) {
        const state = JSON.parse(storedLoadingState);
        if ((state.courseId && state.minimized) || state.isLoading) {
          loadingState.startLoading(state.courseTitle || "", true, false);
          loadingState.setProgress(state.progress || 0);
          if (state.minimized) {
            modalState.setMinimized(true);
          }
        }
      }
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      document.removeEventListener("click", handleClickOutside);
    };
  });

  // Reactive declarations
  $: if (isMounted && $page?.url?.pathname) {
    isSearchPage = $page.url.pathname === "/search";
    if (isSearchPage) {
      const urlParams = new URLSearchParams($page.url.search);
      const filter = urlParams.get("filter") as "relevance" | "latest";
      if (filter) {
        currentFilter = filter;
      }
    }
    // Clear search if navigating away from search page
    if (prevPath === "/search" && $page.url.pathname !== "/search") {
      searchQuery = "";
      showMobileSearch = false;
    }
    prevPath = $page.url.pathname;
  }

  // Event handlers
  function updateOnlineStatus() {
    isOnline = navigator.onLine;
  }

  function updateRecentSearches() {
    recentSearches = getRecentSearches();
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function toggleMobileSearch() {
    showMobileSearch = !showMobileSearch;
  }

  async function handleAuth() {
    if ($user) {
      await signOutUser();
    } else {
      const redirectTo = $page?.url?.pathname || "/";
      goto(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
  }

  function handleAddCourse() {
    goto("/create-course");
  }

  async function handleSearch(e: Event) {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
      updateRecentSearches();
      isSearchFocused = false;
      await goto(
        `/search?q=${encodeURIComponent(searchQuery)}&filter=${currentFilter}`,
      );
    }
  }

  function handleMobileSearch(e: Event) {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
      updateRecentSearches();
      showMobileSearch = false;
      goto(
        `/search?q=${encodeURIComponent(searchQuery)}&filter=${currentFilter}`,
      );
    }
  }

  function handleFilterChange(newFilter: "relevance" | "latest") {
    currentFilter = newFilter;
    showFilterModal = false;
    showMobileSearch = false;

    activeFilterCount = newFilter === "relevance" ? 0 : 1;

    if (searchQuery) {
      goto(`/search?q=${encodeURIComponent(searchQuery)}&filter=${newFilter}`, {
        replaceState: true,
      });
    }
  }

  function handleClearRecentSearches() {
    clearRecentSearches();
    recentSearches = [];
  }
</script>

{#if !isOnline}
  <div class="fixed inset-0 z-50">
    <NoInternet />
  </div>
{:else}
  <div
    class="w-full min-h-screen bg-gradient-light dark:bg-gradient-dark transition-colors"
  >
    {#if !$page?.data?.hideNav}
      <!-- Sidebar - hidden on mobile -->
      <aside
        class="px-2.5 w-[262px] fixed top-0 left-0 bottom-0 border-r border-light-border dark:border-dark-border z-40 hidden lg:flex lg:flex-col transition-colors"
      >
        <!-- Logo section -->
        <div
          class="w-[230px] pb-[24px] pt-[24px] flex flex-col items-start justify-center px-4"
        >
          <div class=" w-[160px] h-[48.4px] relative">
            <a href="/">
              <img
                src="/youversity-logo-large.svg"
                alt="Youversity Logo"
                class="left-0 top-0 absolute"
              />
            </a>
          </div>
        </div>

        <!-- Navigation section -->
        <nav class="py-[16px] flex-1">
          {#each sidebarItems as item}
            <a
              href={item.href}
              class="group flex items-center mx-2 mb-4 px-2 py-2 rounded-lg transition-all"
            >
              <img
                src={item.icon}
                alt={item.label}
                style={$page?.url?.pathname === item.href
                  ? "filter: invert(45%) sepia(95%) saturate(1648%) hue-rotate(325deg) brightness(97%) contrast(91%);"
                  : ""}
                class="w-6 h-6 mr-4 transition-all {$page?.url?.pathname ===
                item.href
                  ? ''
                  : 'opacity-60 group-hover:opacity-100 group-hover:[filter:invert(45%)_sepia(95%)_saturate(1648%)_hue-rotate(325deg)_brightness(97%)_contrast(91%)]'}"
              />
              <span
                class="{$page?.url?.pathname === item.href
                  ? 'text-light-text-primary dark:text-dark-text-primary font-semibold'
                  : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-secondary dark:hover:text-dark-text-secondary hover:font-semibold'} transition-all"
                >{item.label}</span
              >
            </a>
          {/each}
        </nav>

        <!-- Help Center Section -->
        <div
          class="h-[508px] pl-3 pb-8 justify-start items-end gap-4 inline-flex"
        >
          <div
            class="relative mt-[15px] flex flex-col items-start p-6 pb-4 gap-4 border border-light-border dark:border-dark-border rounded-2xl"
          >
            <div class="flex flex-col items-center w-full gap-2">
              <div
                class="absolute -top-5 left-1/2 transform -translate-x-1/2 w-[40px] h-[40px] bg-white rounded-full flex items-center justify-center"
              >
                <img
                  src="/icons/help-circle.svg"
                  alt="Help"
                  class="w-10 h-10 text-white"
                />
              </div>
              <h3
                class="text-body-semibold text-light-text-secondary dark:text-white mt-1"
              >
                Help Center
              </h3>
            </div>
            <div class="flex flex-col items-center w-full">
              <p
                class="text-mini-body text-light-text-tertiary dark:text-dark-text-tertiary text-center"
              >
                Having Trouble carrying out<br />
                a task? Please contact us
              </p>
              <a
                href="/help"
                class="mt-4 w-full py-2 px-4 text-mini-body text-light-text-primary dark:text-dark-text-primary border border-brand-red rounded-lg hover:bg-[#FFF2F3] dark:hover:bg-dark-bg-secondary transition-colors text-center"
              >
                Go to help center
              </a>
            </div>
          </div>
        </div>

        <!-- <div class="border-t border-light-border dark:border-dark-border">
          <button 
            on:click={handleAuth}
            class="flex items-center w-full px-8 h-[44px] text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
          >
            <img 
              src="/icons/logout-03.svg" 
              alt="Sign Out"
              class="w-5 h-5 mr-3 opacity-60" 
            />
            <span class="text-[15px] font-normal">{$user ? 'Sign Out' : 'Sign In'}</span>
          </button>
        </div> -->
      </aside>

      <!-- Main Content with Navigation -->
      <main
        class="lg:pl-64 min-h-screen bg-gradient-light dark:bg-gradient-dark"
      >
        <!-- Header -->
        <!-- <header class="fixed top-0 right-0 left-0 lg:left-64 lg:h-24 px-5 lg:px-4 py-6 lg:ml-1.5 lg:border-b border-light-border dark:border-dark-border {$page.url.pathname.startsWith('/course/') ? 'bg-light-bg-primary dark:bg-dark-bg-primary' : 'bg-light-bg-primary/5 dark:bg-dark-bg-primary/5 !backdrop-blur-[30px]'} z-50"> -->

        <header
          class="fixed top-0 right-0 left-0 lg:left-64 lg:h-24 px-5 lg:px-4 pt-6 pb-4 lg:ml-1.5 lg:border-b border-light-border dark:border-dark-border bg-light-bg-secondary dark:bg-dark-bg-secondary z-50"
        >
          <!-- Mobile Header -->
          <div
            class="h-10 justify-between items-center inline-flex lg:hidden w-full"
          >
            {#if !showMobileSearch}
              <div class="w-[125.33px] h-[38px] relative">
                <a href="/">
                  <img
                    src="/youversity-logo-small.svg"
                    alt="Youversity Logo"
                    class="left-0 top-0 absolute"
                  />
                </a>
              </div>
              <div class="justify-start items-start gap-4 flex">
                <button
                  class="p-2 rounded-[100px] border border-black/5 justify-start items-center gap-2.5 flex"
                  on:click={toggleMobileSearch}
                >
                  <img
                    src="/icons/search-01.svg"
                    alt="Search"
                    class="w-6 h-6"
                  />
                </button>
                <div
                  class="p-2 rounded-[100px] border border-black/5 justify-start items-center gap-2.5 flex"
                >
                  <img
                    src="/icons/notification-block-02.svg"
                    alt="Notification"
                    class="w-6 h-6"
                  />
                </div>
                {#if $user}
                  <div
                    class="h-10 bg-white rounded-[100px] justify-center items-center flex overflow-hidden cursor-pointer"
                    on:click={() => goto("/profile")}
                    on:keydown={(e) => e.key === "Enter" && goto("/profile")}
                    role="button"
                    tabindex="0"
                  >
                    <img
                      src={$user.photoURL || ""}
                      alt={$user.displayName || "User"}
                      class="w-[40px] h-[40px] object-cover"
                    />
                  </div>
                {:else}
                  <div
                    class="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center"
                  >
                    <span class="text-[#2A4D61] font-medium">
                      {$user?.email[0].toUpperCase() || "U"}
                    </span>
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Desktop Header -->
          <div
            class="hidden lg:flex justify-between items-center gap-8 w-full h-full max-w-auto mx-auto"
          >
            <!-- search bar -->
            <div class="flex-1 max-w-[611px] mx-0">
              <form on:submit={handleSearch} class="relative flex-1 w-full">
                <div
                  class="flex items-center bg-white dark:bg-dark-bg-primary border-[1.5px] border-light-border dark:border-dark-border hover:border-brand-red focus-within:border-brand-red rounded-2xl py-2 pl-4 pr-2 h-12 gap-2 transition-all duration-300"
                >
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out {
                    isSearchFocused ? 'opacity-0 -translate-x-2' : 'opacity-60 translate-x-0'
                  }">
                    <img
                      src="/icons/search-01.svg"
                      alt="Search"
                      class="w-6 h-6"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Search courses..."
                    bind:value={searchQuery}
                    on:focus={() => (isSearchFocused = true)}
                    on:blur={() => !searchQuery && (isSearchFocused = false)}
                    class="flex-1 w-full pl-8 focus:pl-0 bg-transparent border-none outline-none focus:outline-none text-body text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary transition-all duration-300"
                  />
                  <button
                    type="button"
                    class="px-2 flex items-center gap-2 border-[1.5px] border-light-border dark:border-dark-border rounded-[10px]"
                    on:click={() => (showFilterModal = true)}
                  >
                    <div class="w-6 h-6 relative">
                      <img
                        src="/icons/filter-icon.svg"
                        alt="Filter"
                        class="w-6 h-6"
                      />
                    </div>
                    <span
                      class="py-1 text-body text-black dark:text-white font-normal tracking-[-0.01em] flex-none"
                    >
                      Filter
                    </span>
                    {#if activeFilterCount > 0}
                      <div
                        class="flex items-center px-2 py-0.5 h-5 bg-brand-red rounded-[40px] flex-none"
                      >
                        <span
                          class="text-white text-[10px] leading-4 font-semibold min-w-[6px] text-center"
                        >
                          {activeFilterCount}
                        </span>
                      </div>
                    {/if}
                  </button>
                </div>

                <!-- Search Suggestions Dropdown -->
                {#if isSearchFocused && recentSearches.length > 0}
                  <div
                    class="absolute top-full left-0 right-[80px] mt-2 bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border shadow-lg z-50"
                    on:click|stopPropagation
                  >
                    <div class="p-6">
                      <!-- Recent Searches -->
                      {#if recentSearches.length > 0}
                        <div class="mb-8">
                          <div
                            class="flex justify-between items-center mb-4 border-b border-light-border dark:border-dark-border pb-2"
                          >
                            <h2
                              class="text-h4-medium text-light-text-primary dark:text-dark-text-primary"
                            >
                              Recent Search
                            </h2>
                            <button
                              class="text-brand-red text-body"
                              on:click={handleClearRecentSearches}
                            >
                              Clear
                            </button>
                          </div>
                          <div class="flex flex-col">
                            {#each recentSearches as search}
                              <button
                                class="flex items-center gap-2 py-2 text-light-text-primary dark:text-dark-text-primary hover:bg-Black/5 dark:hover:bg-White/5 transition-colors"
                                on:click={() => {
                                  searchQuery = search.query;
                                  isSearchFocused = false;
                                  handleSearch(new Event("submit"));
                                }}
                              >
                                <img
                                  src="/icons/time-quarter-pass.svg"
                                  alt="Recent"
                                  class="w-5 h-5 opacity-60"
                                />
                                <span class="text-semi-body-medium"
                                  >{search.query}</span
                                >
                              </button>
                            {/each}
                          </div>
                        </div>
                      {/if}

                      <!-- Try searching for -->
                      {#if recommendations.length > 0}
                        <div>
                          <h2
                            class="text-h4-medium mb-4 text-light-text-primary dark:text-dark-text-primary"
                          >
                            Try searching for
                          </h2>
                          <div class="flex flex-col gap-4">
                            {#each recommendations as recommendation}
                              <button
                                class="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary hover:text-brand-red transition-colors"
                                on:click={() => {
                                  searchQuery = recommendation;
                                  isSearchFocused = false;
                                  handleSearch(new Event("submit"));
                                }}
                              >
                                <img
                                  src="/icons/search.svg"
                                  alt="Search"
                                  class="w-5 h-5 opacity-60"
                                />
                                <span class="text-semi-body"
                                  >{recommendation}</span
                                >
                              </button>
                            {/each}
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}
              </form>
            </div>

            <div class="flex items-center gap-8">
              <div
                class="relative w-12 h-12 flex items-center justify-center border border-light-border dark:border-dark-border rounded-full"
              >
                <img
                  src="/icons/notification-block-02.svg"
                  alt="Notification"
                  class="w-6 h-6"
                />
              </div>

              {#if $user}
                <div
                  class="w-12 h-12 rounded-full bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  on:click={() => goto("/profile")}
                  on:keydown={(e) => e.key === "Enter" && goto("/profile")}
                  role="button"
                  tabindex="0"
                >
                  <img
                    src={$user.photoURL || ""}
                    alt={$user.displayName || "User"}
                    class="w-full h-full object-cover"
                  />
                </div>
              {:else}
                <div
                  class="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center"
                >
                  <span class="text-[#2A4D61] font-medium">
                    {$user?.username[0].toUpperCase() || ""}
                  </span>
                </div>
              {/if}
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="pt-20 px-5 pb-24 lg:pt-28 lg:pl-6 lg:pr-8 lg:pb-8">
          <!-- <div > -->
          <slot />
        </div>

        <!-- Mobile Bottom Navigation -->
        <div class="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex flex-col">
          <nav class="h-20 bg-white border-t border-black/5">
            <div class="flex justify-between items-center h-full">
              {#each mobileNavItems as item}
                <a
                  href={item.href}
                  class="grow shrink basis-0 pt-2 pb-6 flex-col justify-center items-center gap-1 inline-flex"
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    style={$page?.url?.pathname === item.href
                      ? "filter: invert(45%) sepia(95%) saturate(1648%) hue-rotate(325deg) brightness(97%) contrast(91%);"
                      : ""}
                    class="w-6 h-6 {$page?.url?.pathname === item.href
                      ? 'opacity-100'
                      : 'opacity-60'}"
                  />
                  <span
                    class="text-center text-mini-body leading-tight {$page?.url
                      ?.pathname === item.href
                      ? 'text-black font-medium'
                      : 'text-[#494848] font-normal'}"
                  >
                    {item.label}
                  </span>
                </a>
              {/each}
            </div>
          </nav>

          <!-- youversity.io tag -->
          <!-- <div
            class="flex items-center justify-center w-full h-[45px] py-[6px] pb-[10px] bg-white/10 backdrop-blur-[35px]"
          >
            <div class="flex items-center gap-2">
              <img
                src="/icons/square-lock.svg"
                alt="Location"
                class="w-3 h-3 text-[#667085]"
              />

              <span
                class="text-[10px] text-[#667085] font-['Poppins'] font-normal leading-4 tracking-[-0.01em] text-center underline-position-from-font decoration-skip-ink-none"
                >youversity.io</span
              >
            </div>
          </div> -->
        </div>
      </main>
    {:else}
      <!-- Content without Navigation -->
      <main class="w-full min-h-screen bg-gradient-light dark:bg-gradient-dark">
        <slot />
      </main>
    {/if}
  </div>
{/if}

<FilterModal
  show={showFilterModal}
  {currentFilter}
  onFilterChange={handleFilterChange}
  onClose={() => {
    showFilterModal = false;
  }}
/>

<!-- Mobile Search Modal -->
{#if showMobileSearch}
  <div
    class="fixed inset-0 z-[60] lg:hidden bg-gradient-to-b from-[#FFF2F3] to-BackgoundBlue dark:from-dark-bg-secondary dark:to-dark-bg-primary/40"
  >
    <!-- Search Header -->
    <div class="px-5 pt-6">
      <div class="flex items-center gap-3">
        <button
          class="p-2"
          on:click={() => {
            showMobileSearch = false;
            searchQuery = "";
          }}
        >
          <img src="/icons/arrow-left.svg" alt="Back" class="w-6 h-6" />
        </button>

        <form on:submit={handleMobileSearch} class="flex-1">
          <div
            class="flex items-center bg-white dark:bg-dark-bg-primary border border-brand-red rounded-2xl h-12"
          >
            <input
              type="text"
              placeholder="Search Courses..."
              bind:value={searchQuery}
              class="flex-1 px-4 bg-transparent border-none focus:outline-none text-body text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary"
              autofocus
            />
            <button
              type="button"
              class="px-4 py-2"
              on:click={() => (showFilterModal = true)}
            >
              <img src="/icons/filter-icon.svg" alt="Filter" class="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Search Content -->
    <div class="px-5 pt-6">
      <!-- Recent Searches -->
      {#if recentSearches.length > 0}
        <div class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-h4-medium">Recent Search</h2>
            <button
              class="text-brand-red text-semi-body"
              on:click={handleClearRecentSearches}
            >
              Clear
            </button>
          </div>
          <div class="flex flex-col gap-4">
            {#each recentSearches as search}
              <button
                class="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary"
                on:click={() => {
                  searchQuery = search.query;
                  handleMobileSearch(new Event("submit"));
                }}
              >
                <img
                  src="/icons/clock.svg"
                  alt="Recent"
                  class="w-5 h-5 opacity-60"
                />
                <span class="text-semi-body">{search.query}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Try searching for -->
      {#if recommendations.length > 0}
        <div>
          <h2 class="text-h4-medium mb-4">Try searching for</h2>
          <div class="flex flex-col gap-4">
            {#each recommendations as recommendation}
              <button
                class="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary"
                on:click={() => {
                  searchQuery = recommendation;
                  handleMobileSearch(new Event("submit"));
                }}
              >
                <img
                  src="/icons/search.svg"
                  alt="Search"
                  class="w-5 h-5 opacity-60"
                />
                <span class="text-semi-body">{recommendation}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Global modal that persists across all pages -->
<div class="fixed-overlay">
  <CourseGenerationModal />
</div>

<style>
  :global(body) {
    @apply antialiased;
  }

  /* Remove or modify this part that's affecting all fixed elements */
  /* :global(.fixed) {
    @apply backdrop-blur-[2px];
  } */

  .fixed-overlay {
    position: fixed;
    top: 7rem;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 100;
  }

  /* Allow pointer events on the modal itself */
  .fixed-overlay :global(.modal-content) {
    pointer-events: auto;
  }
</style>
