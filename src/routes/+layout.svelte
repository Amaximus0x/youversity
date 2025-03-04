<script lang="ts">
  import { page } from "$app/stores";
  import { user, isAuthenticated } from "$lib/stores/auth";
  import { signOutUser } from "$lib/services/auth";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import { theme } from "$lib/stores/theme";
  import "../app.css";
  import { goto } from "$app/navigation";
  import NoInternet from "$lib/components/NoInternet.svelte";
  import { onMount, onDestroy } from "svelte";
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
  import { auth } from '$lib/firebase';
  import { notifications } from '$lib/stores/notificationStore';
  import { onAuthStateChanged } from 'firebase/auth';
  import NotificationButton from "$lib/components/NotificationButton.svelte";
  import { NotificationService } from "$lib/services/notificationService";
  import { get } from "svelte/store";
  import { isOnline } from "$lib/stores/network";
  import SearchModal from "$lib/components/modals/SearchModal.svelte";
  import { createEventDispatcher } from 'svelte';
  import type { SearchFilter } from "$lib/types/search";
  import { DeploymentAnnouncements } from "$lib/services/deploymentAnnouncements";

  // State variables
  let isSearchPage = false;
  let isMounted = false;
  let showFilterModal = false;
  let currentFilter: SearchFilter = "relevance";
  let activeFilterCount = 0;
  let showMobileSearch = false;
  let menuOpen = false;
  let searchQuery = "";
  let isSearchFocused = false;
  let prevPath = "";

  // Initialize search-related arrays
  let recentSearches: Array<{ id: string; query: string; timestamp: Date }> = [];
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
      href: "/settings?tab=profile",
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
    { icon: "/icons/settings-02.svg", label: "Settings", href: "/settings?tab=profile" },
  ];

  // Add new state for profile modal
  let showProfileModal = false;

  // Toggle profile modal
  function toggleProfileModal() {
    showProfileModal = !showProfileModal;
  }

  // Handle profile click
  function handleProfileClick() {
    toggleProfileModal();
    goto("/settings");
  }

  // Add this function to handle clicks outside the search area
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const searchForm = target.closest("form");
    const searchDropdown = target.closest(".search-dropdown");
    
    if (!searchForm && !searchDropdown) {
      isSearchFocused = false;
      console.log("Clicked outside search area, closing dropdown");
    }
  }

  let unsubscribeNotifications: (() => void) | null = null;

  // Add reactive statement for user changes
  $: if ($user) {
    loadRecentSearches();
  }

  // Function to load recent searches
  async function loadRecentSearches() {
    if ($user) {
      console.log("Loading recent searches for user:", $user.uid);
      try {
        recentSearches = await getRecentSearches($user.uid);
        console.log("Loaded recent searches:", recentSearches);
      } catch (error) {
        console.error("Error loading recent searches:", error);
        recentSearches = [];
      }
    }
  }

  // Load data on mount
  onMount(async () => {
    const cleanup = async () => {
      isMounted = true;
      updateOnlineStatus();
      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);

      // Load recent searches
      await loadRecentSearches();

      // Register service worker for offline functionality
      if ("serviceWorker" in navigator) {
        try {
          // Check if there's an existing service worker causing issues
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          // Unregister any existing service workers to clear potential issues
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Unregistered existing service worker');
          }
          
          // Register the service worker again
          const registration = await navigator.serviceWorker.register("/service-worker.js", {
            scope: '/'
          });
          console.log("ServiceWorker registration successful with scope:", registration.scope);
          
          // Handle service worker updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New service worker installed, content will update when all tabs close');
                  } else {
                    console.log('Service worker installed for offline use');
                  }
                }
              };
            }
          };
        } catch (err) {
          console.error("ServiceWorker registration failed:", err);
        }
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

      // Check for and send any new deployment announcements
      await DeploymentAnnouncements.checkAndSendDeploymentAnnouncements();
    };

    cleanup();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      document.removeEventListener("click", handleClickOutside);
    };
  });

  onMount(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        // Initialize notifications for authenticated user
        unsubscribeNotifications = notifications.init(user.uid);
      } else {
        // Cleanup notification subscription
        if (unsubscribeNotifications) {
          unsubscribeNotifications();
          unsubscribeNotifications = null;
        }
      }
    });
  });

  // Reactive declarations
  $: if (isMounted && $page?.url?.pathname) {
    isSearchPage = $page.url.pathname === "/search";
    if (isSearchPage) {
      const urlParams = new URLSearchParams($page.url.search);
      const filter = urlParams.get("filter") as SearchFilter;
      if (filter) {
        currentFilter = filter;
      }
    }
    // Clear search if navigating away from search page
    if (prevPath === "/search" && $page.url.pathname !== "/search") {
      if (!$page.url.pathname.startsWith("/search")) {
        searchQuery = "";
        showMobileSearch = false;
      }
    }
    prevPath = $page.url.pathname;
    console.log("URL changed:", {
      current: $page.url.pathname,
      previous: prevPath,
      searchQuery,
      recentSearches: recentSearches.length,
    });
  }

  // Event handlers
  function updateOnlineStatus() {
    if (browser) {
      // Use the imported updateOnlineStatus function instead
      // This line is now handled by the network store
    }
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function toggleMobileSearch() {
    showMobileSearch = !showMobileSearch;
  }

  async function handleAuth() {
    toggleProfileModal();
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

  async function handleMobileSearch(e: Event) {
    e.preventDefault();
    if (searchQuery.trim()) {
      showMobileSearch = false;
      goto(
        `/search?q=${encodeURIComponent(searchQuery)}&filter=${currentFilter}`,
      );

      // Save search history asynchronously
      if ($user) {
        Promise.all([
          saveRecentSearch(searchQuery, $user.uid),
          getRecentSearches($user.uid),
        ])
          .then(([_, searches]) => {
            recentSearches = searches;
          })
          .catch((error) => {
            console.error("Error handling search history:", error);
          });
      }
    }
  }

  async function handleSearch(e: Event) {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Desktop search initiated:", searchQuery);
      isSearchFocused = false;
      goto(
        `/search?q=${encodeURIComponent(searchQuery)}&filter=${currentFilter}`,
      );

      // Save search history asynchronously
      if ($user) {
        Promise.all([
          saveRecentSearch(searchQuery, $user.uid),
          getRecentSearches($user.uid),
        ])
          .then(([_, searches]) => {
            recentSearches = searches;
          })
          .catch((error) => {
            console.error("Error handling search history:", error);
          });
      }
    }
  }

  function handleFilterChange(newFilter: SearchFilter) {
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

  async function handleClearRecentSearches() {
    try {
      if ($user) {
        await clearRecentSearches($user.uid);
        recentSearches = [];
      }
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  }

  // Add near the top of the script section
  $: if ($user) {
    console.log("Auth state changed:", {
      user: $user,
      isAuthenticated: $isAuthenticated,
    });
    console.log("User data:", {
      username: $user.username,
      displayName: $user.displayName,
      email: $user.email,
      uid: $user.uid,
    });
  }

  // Function to force refresh all profile images in the header
  function refreshHeaderProfileImages() {
    if (browser) {
      setTimeout(() => {
        const headerImages = document.querySelectorAll('.header-profile-image');
        console.log(`Refreshing ${headerImages.length} header profile images`);
        
        headerImages.forEach((element) => {
          if (element instanceof HTMLImageElement) {
            const img = element;
            const timestamp = Date.now();
            const baseUrl = img.src.split('?')[0];
            img.src = `${baseUrl}?t=${timestamp}`;
            console.log(`Refreshed header image: ${img.src}`);
          }
        });
      }, 200);
    }
  }

  // Listen for profile updates from child components
  function handleProfileUpdate(event: CustomEvent) {
    console.log('Profile update event received in layout:', event.detail);
    refreshHeaderProfileImages();
  }

  // Set up event listener for custom events when component mounts
  onMount(() => {
    if (browser) {
      // Add global event listener for profile updates
      window.addEventListener('profileUpdate', handleProfileUpdate as EventListener);
    }
    
    return () => {
      if (browser) {
        // Clean up event listener when component is destroyed
        window.removeEventListener('profileUpdate', handleProfileUpdate as EventListener);
      }
    };
  });
</script>

<div class="app {$theme}">
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
                  style={($page?.url?.pathname === item.href.split('?')[0] || 
                         (item.href.includes('/settings') && $page?.url?.pathname === '/settings'))
                    ? "filter: invert(45%) sepia(95%) saturate(1648%) hue-rotate(325deg) brightness(97%) contrast(91%);"
                    : ""}
                  class="w-6 h-6 mr-4 transition-all {($page?.url?.pathname ===
                  item.href.split('?')[0] || 
                  (item.href.includes('/settings') && $page?.url?.pathname === '/settings'))
                    ? ''
                    : 'opacity-60 group-hover:opacity-100 group-hover:[filter:invert(45%)_sepia(95%)_saturate(1648%)_hue-rotate(325deg)_brightness(97%)_contrast(91%)] dark:opacity-100 dark:invert dark:brightness-200 dark:group-hover:opacity-100 dark:group-hover:invert-0 dark:group-hover:brightness-100'}"
                />
                <span
                  class="{($page?.url?.pathname === item.href.split('?')[0] || 
                          (item.href.includes('/settings') && $page?.url?.pathname === '/settings'))
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
                  href="/settings?tab=contact"
                  class="mt-4 w-full py-2 px-4 text-mini-body text-light-text-primary dark:text-dark-text-primary border border-brand-red rounded-lg hover:bg-[#FFF2F3] dark:hover:bg-dark-bg-secondary transition-colors text-center"
                >
                  Go to help center
                </a>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content with Navigation -->
        <main
          class="lg:pl-64 min-h-screen bg-gradient-light dark:bg-gradient-dark"
        >
          <!-- Header -->
          <!-- <header class="fixed top-0 right-0 left-0 lg:left-64 lg:h-24 px-5 lg:px-4 py-6 lg:ml-1.5 lg:border-b border-light-border dark:border-dark-border {$page.url.pathname.startsWith('/course/') ? 'bg-light-bg-primary dark:bg-dark-bg-primary' : 'bg-light-bg-primary/5 dark:bg-dark-bg-primary/5 !backdrop-blur-[30px]'} z-50"> -->

          <header
            class="fixed top-0 right-0 left-0 lg:left-64 lg:h-24 px-5 lg:px-4 pt-6 pb-4 lg:ml-1.5 lg:border-b border-light-border dark:border-dark-border bg-light-bg-secondary dark:bg-dark-bg-secondary z-40"
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
                    class="p-2 rounded-[100px] border border-black/5 dark:border-white/10 justify-start items-center gap-2.5 flex"
                    on:click={toggleMobileSearch}
                  >
                    <img
                      src="/icons/search-01.svg"
                      alt="Search"
                      class="w-6 h-6 opacity-60 dark:opacity-100 dark:invert dark:brightness-200"
                    />
                  </button>
                  <div
                    class="p-2 rounded-[100px] border border-black/5 dark:border-white/10 justify-start items-center gap-2.5 flex"
                  >
                    <NotificationButton />
                  </div>
                  {#if $user}
                  <div
                    class="w-10 h-10 rounded-full bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    on:click={toggleProfileModal}
                    on:keydown={(e) => e.key === "Enter" && toggleProfileModal()}
                    role="button"
                    tabindex="0"
                  >
                    {#if $user.photoURL}
                      <img
                        src={$user.photoURL ? ($user.photoURL + '?t=' + Date.now()) : ""}
                        alt={$user.displayName || "User"}
                        class="w-full h-full object-cover header-profile-image"
                      />
                    {:else}
                      <div
                        class="w-full h-full flex items-center justify-center bg-[#F5F5F5]"
                      >
                        <span class="text-[#2A4D61] font-medium">
                          {$user && $user.email ? $user.email[0].toUpperCase() : "U"}
                        </span>
                      </div>
                    {/if}
                  </div>
                {:else}
                  <div
                    class="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center cursor-pointer"
                    on:click={() => goto("/login")}
                    on:keydown={(e) => e.key === "Enter" && goto("/login")}
                    role="button"
                    tabindex="0"
                  >
                    <span class="text-[#2A4D61] font-medium">U</span>
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
                <form
                  on:submit|preventDefault={handleSearch}
                  class="relative flex-1 w-full"
                >
                  <div
                    class="flex items-center bg-light-bg-primary dark:bg-dark-bg-primary border-[1.5px] border-light-border dark:border-dark-border hover:border-brand-red focus-within:border-brand-red rounded-2xl py-2 pl-4 pr-2 h-12 gap-2 transition-all duration-300"
                  >
                    <div
                      class="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out {isSearchFocused
                        ? 'opacity-0 -translate-x-2'
                        : 'opacity-60 translate-x-0'}"
                    >
                      <img
                        src="/icons/search-01.svg"
                        alt="Search"
                        class="w-6 h-6 opacity-60 group-hover:opacity-100 group-hover:[filter:invert(45%)_sepia(95%)_saturate(1648%)_hue-rotate(325deg)_brightness(97%)_contrast(91%)] dark:opacity-100 dark:invert dark:brightness-200 dark:group-hover:opacity-100 dark:group-hover:invert-0 dark:group-hover:brightness-100'"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Search courses..."
                      bind:value={searchQuery}
                      on:focus|stopPropagation={() => {
                        isSearchFocused = true;
                        console.log("Search focused, isSearchFocused:", isSearchFocused);
                        console.log("Recent searches:", recentSearches);
                      }}
                      on:blur={() => {
                        // Only hide dropdown if clicked outside search area
                        setTimeout(() => {
                          const activeElement = document.activeElement;
                          const searchForm = activeElement?.closest("form");
                          if (!searchForm) {
                            isSearchFocused = false;
                            console.log("Search blurred, isSearchFocused:", isSearchFocused);
                          }
                        }, 200);
                      }}
                      class="flex-1 w-full pl-8 focus:pl-0 bg-transparent border-none outline-none focus:outline-none text-body text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary transition-all duration-300"
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

                  <!-- Recent Searches Dropdown -->
                  {#if isSearchFocused && recentSearches && recentSearches.length > 0}
                    <div
                      class="search-dropdown absolute top-full left-0 right-[80px] mt-2 bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border shadow-lg z-50"
                      on:mousedown|stopPropagation
                      on:click|stopPropagation
                    >
                      <div class="p-6">
                        <!-- Recent Searches -->
                        <div class="mb-8">
                          <div
                            class="flex justify-between items-center mb-2 border-b border-light-border dark:border-dark-border pb-2"
                          >
                            <h2
                              class="text-h4-medium text-light-text-primary dark:text-dark-text-primary"
                            >
                              Recent Search
                            </h2>
                            <button
                              class="text-brand-red text-body"
                              on:mousedown|stopPropagation|preventDefault={handleClearRecentSearches}
                            >
                              Clear
                            </button>
                          </div>
                          <div class="flex flex-col">
                            {#each recentSearches as search}
                              <button
                                class="flex items-center gap-2 py-2 text-light-text-secondary dark:text-dark-text-secondary hover:bg-Black/5 dark:hover:bg-White/5 transition-colors"
                                on:mousedown|preventDefault|stopPropagation={() => {
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
                      </div>
                    </div>
                  {/if}
                </form>
              </div>

              <div class="flex items-center gap-8">
                <div
                  class="relative w-12 h-12 flex items-center justify-center border border-light-border dark:border-dark-border rounded-full"
                >
                  <NotificationButton 
                    on:focusCourseObjective={() => {
                      if ($page.url.pathname === '/') {
                        window.dispatchEvent(new CustomEvent('focusCourseObjective'));
                      }
                    }}
                  />
                </div>

                {#if $user}
                  <div
                    class="w-12 h-12 rounded-full bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    on:click={toggleProfileModal}
                    on:keydown={(e) => e.key === "Enter" && toggleProfileModal()}
                    role="button"
                    tabindex="0"
                  >
                    {#if $user.photoURL}
                      <img
                        src={$user.photoURL ? ($user.photoURL + '?t=' + Date.now()) : ""}
                        alt={$user.displayName || "User"}
                        class="w-full h-full object-cover header-profile-image"
                      />
                    {:else}
                      <div
                        class="w-full h-full flex items-center justify-center bg-[#F5F5F5]"
                      >
                        <span class="text-[#2A4D61] font-medium">
                          {$user && $user.email ? $user.email[0].toUpperCase() : "U"}
                        </span>
                      </div>
                    {/if}
                  </div>
                {:else}
                  <div
                    class="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center cursor-pointer"
                    on:click={() => goto("/login")}
                    on:keydown={(e) => e.key === "Enter" && goto("/login")}
                    role="button"
                    tabindex="0"
                  >
                    <span class="text-[#2A4D61] font-medium">U</span>
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
            <nav class="h-20 bg-light-bg-primary dark:bg-dark-bg-primary border-t border-light-border dark:border-dark-border">
              <div class="flex justify-between items-center h-full">
                {#each mobileNavItems as item}
                  <a
                    href={item.href}
                    class="grow shrink basis-0 pt-2 pb-6 flex-col justify-center items-center gap-1 inline-flex"
                  >
                    <img
                      src={item.icon}
                      alt={item.label}
                      style={($page?.url?.pathname === item.href.split('?')[0] || 
                             (item.href.includes('/settings') && $page?.url?.pathname === '/settings'))
                        ? "filter: invert(45%) sepia(95%) saturate(1648%) hue-rotate(325deg) brightness(97%) contrast(91%);"
                        : " "}
                      class="w-6 h-6 {($page?.url?.pathname === item.href.split('?')[0] || 
                                      (item.href.includes('/settings') && $page?.url?.pathname === '/settings'))
                        ? 'opacity-100'
                        : 'opacity-60 dark:opacity-100 dark:invert dark:brightness-200'}"
                    />
                    <span
                      class="text-center text-mini-body leading-tight {($page?.url?.pathname === item.href.split('?')[0] || 
                                                                       (item.href.includes('/settings') && $page?.url?.pathname === '/settings'))
                        ? 'text-light-text-primary dark:text-dark-text-primary font-medium'
                        : 'text-light-text-secondary dark:text-dark-text-secondary font-normal'}"
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
</div>

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
          <div
            class="flex justify-between items-center pb-2 border-b border-light-border dark:border-dark-border mb-2"
          >
            <h2 class="text-h4-medium">Recent Search</h2>
            <button
              class="text-brand-red text-body"
              on:click={handleClearRecentSearches}
            >
              Clear
            </button>
          </div>
          <div class="flex flex-col gap-4">
            {#each recentSearches as search}
              <button
                class="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary"
                on:click={() => {
                  searchQuery = search.query;
                  handleMobileSearch(new Event("submit"));
                }}
              >
                <img
                  src="/icons/time-quarter-pass.svg"
                  alt="Recent"
                  class="w-5 h-5 opacity-60"
                />
                <span class="text-semibody-medium">{search.query}</span>
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
                class="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary hover:bg-black/10"
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
                <span class="text-semibody-medium">{recommendation}</span>
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

<!-- Add Profile Modal -->
{#if showProfileModal}
  <button
    class="fixed top-24 right-8 z-50 drop-shadow(0px 4px 73px 0px #000000/17);
)"
    transition:fade={{ duration: 200 }}
    on:click|stopPropagation
  >
    <div
      class="w-[325px] flex flex-col p-2 gap-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-xl overflow-hidden shadow-lg"
    >
      <!-- Profile Section -->
      <button
        class="w-full p-2 flex items-center gap-2 border bg-Black/5 dark:bg-White/5 border-Grey dark:border-Grey rounded-lg"
        on:click={handleProfileClick}
      >
        <div class="items-start">
          {#if $user?.photoURL}
            <img
              src={$user.photoURL ? ($user.photoURL + '?t=' + Date.now()) : ""}
              alt={$user.displayName || "User"}
              class="w-[48px] h-[48px] rounded-full object-cover header-profile-image"
            />
          {:else}
            <div
              class="w-[48px] h-[48px] rounded-full bg-[#F5F5F5] flex items-center justify-center"
            >
              <span class="text-[#2A4D61] font-medium">
                {$user && $user.email ? $user.email[0].toUpperCase() : "U"}
              </span>
            </div>
          {/if}
        </div>
        <div>
        <div class="w-[203px] flex flex-col items-start">
          <span
            class="text-h4-medium text-light-text-primary dark:text-dark-text-primary"
          >
            {$user?.displayName || "User"}
          </span>
          <span
            class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary"
          >
            {$user?.username || ""}
          </span>
          </div>
        </div>

        <div>
        <svg
          class="w-6 h-6 text-brand-turquoise"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M21.011 14.0966C21.5329 13.9559 21.7939 13.8855 21.8969 13.7509C22 13.6164 22 13.3999 22 12.967V11.0333C22 10.6004 22 10.3839 21.8969 10.2494C21.7938 10.1148 21.5329 10.0444 21.011 9.90365C19.0606 9.37766 17.8399 7.33858 18.3433 5.40094C18.4817 4.86806 18.5509 4.60163 18.4848 4.44536C18.4187 4.28909 18.2291 4.18141 17.8497 3.96603L16.125 2.9868C15.7528 2.77546 15.5667 2.66979 15.3997 2.69229C15.2326 2.71479 15.0442 2.9028 14.6672 3.2788C13.208 4.73455 10.7936 4.73449 9.33434 3.27871C8.95743 2.9027 8.76898 2.7147 8.60193 2.69219C8.43489 2.66969 8.24877 2.77536 7.87653 2.9867L6.15184 3.96594C5.77253 4.1813 5.58287 4.28898 5.51678 4.44522C5.45068 4.60147 5.51987 4.86794 5.65825 5.40087C6.16137 7.33857 4.93972 9.3777 2.98902 9.90367C2.46712 10.0444 2.20617 10.1148 2.10308 10.2493C2 10.3839 2 10.6004 2 11.0333V12.967C2 13.3999 2 13.6164 2.10308 13.7509C2.20615 13.8855 2.46711 13.9559 2.98902 14.0966C4.9394 14.6226 6.16008 16.6617 5.65672 18.5993C5.51829 19.1322 5.44907 19.3986 5.51516 19.5549C5.58126 19.7112 5.77092 19.8189 6.15025 20.0342L7.87495 21.0135C8.24721 21.2248 8.43334 21.3305 8.6004 21.308C8.76746 21.2855 8.95588 21.0974 9.33271 20.7214C10.7927 19.2645 13.2088 19.2644 14.6689 20.7213C15.0457 21.0974 15.2341 21.2854 15.4012 21.3079C15.5682 21.3304 15.7544 21.2247 16.1266 21.0134L17.8513 20.0341C18.2307 19.8188 18.4204 19.7111 18.4864 19.5548C18.5525 19.3985 18.4833 19.1321 18.3448 18.5992C17.8412 16.6617 19.0609 14.6227 21.011 14.0966Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        </div>
      </button>

      <!-- Logout Button -->
      <button
        class="w-full p-2 flex items-center justify-center gap-4 text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary border border-Grey dark:border-Grey rounded-lg transition-colors"
        on:click={handleAuth}
      >
        <!-- <div class="flex items-center justify-center gap-4"> -->
        <span class="text-semi-body">Logout</span>
        <svg
          class="w-6 h-6 text-brand-red"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="logout-03">
            <path
              id="Vector"
              d="M15.5 17.625C15.4264 19.4769 13.8831 21.0494 11.8156 20.9988C11.3346 20.987 10.7401 20.8194 9.55112 20.484C6.68961 19.6768 4.20555 18.3203 3.60956 15.2815C3.5 14.723 3.5 14.0944 3.5 12.8373V11.1627C3.5 9.90561 3.5 9.27705 3.60956 8.71846C4.20555 5.67965 6.68961 4.32316 9.55112 3.51603C10.7401 3.18064 11.3346 3.01295 11.8156 3.00119C13.8831 2.95061 15.4264 4.52307 15.5 6.37501"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              id="Vector_2"
              d="M21.5 12H10.5M21.5 12C21.5 11.2998 19.5057 9.99153 19 9.5M21.5 12C21.5 12.7002 19.5057 14.0085 19 14.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
        </svg>
        <!-- </div> -->
      </button>
    </div>
  </button>

  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 bg-black/5 dark:bg-white/5"
    on:click={toggleProfileModal}
    on:keydown={(e) => e.key === "Enter" && toggleProfileModal()}
    role="button"
    tabindex="0"
  />
{/if}

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
