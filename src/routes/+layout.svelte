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
                <div class="flex justify-start items-center">
                  <!-- //logo icon -->
                  <img
                    src="/YV.svg"
                    alt="Youversity Logo"
                    class="w-[35.29px] h-[38px] lg:w-[44.97px] lg:h-[48.43px]"
                  />
        
                  <div class="pt-2">
                    <!-- //logo text -->
                    <svg
                      class="w-[86.61px] h-[16.76px] lg:w-[107.83px] lg:h-[21.36px] text-light-text-primary dark:text-dark-text-primary"
                      viewBox="0 0 109 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <g id="Youversity">
                        <path
                          d="M12.8206 1.85152L8.04707 11.0458V16.276H5.68104V11.0458L0.886719 1.85152H3.52256L6.86406 8.92886L10.2056 1.85152H12.8206Z"
                          fill="currentColor"
                        />
                        <path
                          d="M19.6587 16.4628C18.5794 16.4628 17.6039 16.2207 16.7322 15.7364C15.8605 15.2383 15.1756 14.5465 14.6775 13.6609C14.1794 12.7616 13.9304 11.7238 13.9304 10.5477C13.9304 9.38546 14.1863 8.35465 14.6983 7.45528C15.2102 6.55591 15.909 5.86409 16.7945 5.37981C17.68 4.89554 18.6693 4.6534 19.7624 4.6534C20.8555 4.6534 21.8448 4.89554 22.7303 5.37981C23.6159 5.86409 24.3146 6.55591 24.8266 7.45528C25.3385 8.35465 25.5945 9.38546 25.5945 10.5477C25.5945 11.71 25.3316 12.7408 24.8058 13.6402C24.28 14.5395 23.5605 15.2383 22.6473 15.7364C21.748 16.2207 20.7517 16.4628 19.6587 16.4628ZM19.6587 14.4081C20.2675 14.4081 20.8347 14.2628 21.3605 13.9722C21.9002 13.6817 22.336 13.2458 22.6681 12.6647C23.0001 12.0836 23.1662 11.3779 23.1662 10.5477C23.1662 9.71754 23.0071 9.0188 22.6888 8.4515C22.3706 7.87037 21.9486 7.43452 21.4228 7.14396C20.897 6.85339 20.3297 6.70811 19.7209 6.70811C19.1121 6.70811 18.5448 6.85339 18.019 7.14396C17.5071 7.43452 17.0989 7.87037 16.7945 8.4515C16.4901 9.0188 16.3379 9.71754 16.3379 10.5477C16.3379 11.7792 16.6492 12.7339 17.2719 13.4119C17.9083 14.076 18.7039 14.4081 19.6587 14.4081Z"
                          fill="currentColor"
                        />
                        <path
                          d="M38.29 4.84019V16.276H35.924V14.927C35.5504 15.3974 35.0592 15.771 34.4504 16.0477C33.8554 16.3106 33.2189 16.442 32.541 16.442C31.6416 16.442 30.8322 16.2552 30.1127 15.8817C29.407 15.5081 28.8466 14.9546 28.4315 14.2213C28.0303 13.488 27.8297 12.6024 27.8297 11.5647V4.84019H30.1749V11.2119C30.1749 12.2358 30.4309 13.0244 30.9429 13.5779C31.4548 14.1175 32.1535 14.3873 33.0391 14.3873C33.9246 14.3873 34.6233 14.1175 35.1353 13.5779C35.6611 13.0244 35.924 12.2358 35.924 11.2119V4.84019H38.29Z"
                          fill="currentColor"
                        />
                        <path
                          d="M45.8325 14.159L49.0703 4.84019H51.5816L47.2231 16.276H44.4005L40.0627 4.84019H42.5948L45.8325 14.159Z"
                          fill="currentColor"
                        />
                        <path
                          d="M63.8511 10.2779C63.8511 10.7068 63.8235 11.0943 63.7681 11.4402H55.0304C55.0996 12.3534 55.4386 13.0867 56.0474 13.6402C56.6562 14.1936 57.4034 14.4704 58.2889 14.4704C59.5618 14.4704 60.4612 13.9376 60.987 12.8722H63.5398C63.1939 13.9238 62.5643 14.7886 61.6511 15.4666C60.7518 16.1307 59.631 16.4628 58.2889 16.4628C57.1958 16.4628 56.2134 16.2207 55.3417 15.7364C54.4839 15.2383 53.8059 14.5465 53.3078 13.6609C52.8235 12.7616 52.5814 11.7238 52.5814 10.5477C52.5814 9.37162 52.8166 8.34081 53.287 7.45528C53.7713 6.55591 54.4424 5.86409 55.3002 5.37981C56.1719 4.89554 57.1681 4.6534 58.2889 4.6534C59.3681 4.6534 60.3298 4.88862 61.1738 5.35906C62.0178 5.8295 62.675 6.49365 63.1455 7.3515C63.6159 8.19553 63.8511 9.171 63.8511 10.2779ZM61.3813 9.53074C61.3675 8.65905 61.0562 7.96031 60.4474 7.43452C59.8386 6.90874 59.0845 6.64585 58.1851 6.64585C57.3688 6.64585 56.67 6.90874 56.0889 7.43452C55.5078 7.94647 55.1619 8.64521 55.0512 9.53074H61.3813Z"
                          fill="currentColor"
                        />
                        <path
                          d="M68.5456 6.50056C68.8915 5.91943 69.3481 5.46975 69.9154 5.15151C70.4965 4.81944 71.1814 4.6534 71.9701 4.6534V7.10245H71.3682C70.4412 7.10245 69.7355 7.33767 69.2512 7.80811C68.7808 8.27855 68.5456 9.0949 68.5456 10.2572V16.276H66.1796V4.84019H68.5456V6.50056Z"
                          fill="currentColor"
                        />
                        <path
                          d="M78.2959 16.4628C77.3965 16.4628 76.5871 16.3037 75.8676 15.9854C75.1619 15.6534 74.6016 15.2106 74.1865 14.6571C73.7714 14.0898 73.55 13.4603 73.5223 12.7685H75.9714C76.0129 13.2527 76.2412 13.6609 76.6563 13.993C77.0852 14.3112 77.6179 14.4704 78.2544 14.4704C78.9185 14.4704 79.4305 14.3458 79.7902 14.0968C80.1638 13.8339 80.3506 13.5018 80.3506 13.1005C80.3506 12.6716 80.1431 12.3534 79.728 12.1458C79.3267 11.9383 78.6833 11.71 77.7978 11.4609C76.9399 11.2257 76.2412 10.9974 75.7016 10.776C75.1619 10.5546 74.6915 10.2156 74.2902 9.75904C73.9028 9.30244 73.7091 8.70056 73.7091 7.95339C73.7091 7.34459 73.889 6.79113 74.2487 6.29302C74.6085 5.78107 75.1204 5.37981 75.7846 5.08925C76.4626 4.79868 77.2374 4.6534 78.1091 4.6534C79.4097 4.6534 80.4544 4.98547 81.243 5.64962C82.0456 6.29993 82.4745 7.19238 82.5298 8.32697H80.1638C80.1223 7.81502 79.9147 7.40685 79.5412 7.10245C79.1676 6.79805 78.6626 6.64585 78.0261 6.64585C77.4034 6.64585 76.9261 6.76346 76.594 6.99867C76.2619 7.23389 76.0959 7.54521 76.0959 7.93263C76.0959 8.23704 76.2066 8.49301 76.428 8.70056C76.6494 8.9081 76.9192 9.07414 77.2374 9.19867C77.5556 9.30936 78.0261 9.45464 78.6487 9.63452C79.4789 9.8559 80.1569 10.0842 80.6827 10.3194C81.2223 10.5408 81.6858 10.8729 82.0732 11.3156C82.4606 11.7584 82.6613 12.3465 82.6751 13.0798C82.6751 13.7301 82.4952 14.3112 82.1355 14.8232C81.7757 15.3351 81.2638 15.7364 80.5996 16.0269C79.9493 16.3175 79.1814 16.4628 78.2959 16.4628Z"
                          fill="currentColor"
                        />
                        <path
                          d="M86.4354 3.3251C86.0065 3.3251 85.6468 3.17982 85.3562 2.88925C85.0656 2.59869 84.9203 2.23894 84.9203 1.81001C84.9203 1.38108 85.0656 1.02133 85.3562 0.73077C85.6468 0.440205 86.0065 0.294922 86.4354 0.294922C86.8505 0.294922 87.2034 0.440205 87.4939 0.73077C87.7845 1.02133 87.9298 1.38108 87.9298 1.81001C87.9298 2.23894 87.7845 2.59869 87.4939 2.88925C87.2034 3.17982 86.8505 3.3251 86.4354 3.3251ZM87.5977 4.84019V16.276H85.2317V4.84019H87.5977Z"
                          fill="currentColor"
                        />
                        <path
                          d="M93.4645 6.77037V13.1005C93.4645 13.5295 93.5613 13.8408 93.755 14.0345C93.9626 14.2144 94.3085 14.3043 94.7927 14.3043H96.2456V16.276H94.3777C93.3123 16.276 92.4959 16.0269 91.9286 15.5288C91.3613 15.0307 91.0777 14.2213 91.0777 13.1005V6.77037H89.7286V4.84019H91.0777V1.9968H93.4645V4.84019H96.2456V6.77037H93.4645Z"
                          fill="currentColor"
                        />
                        <path
                          d="M108.721 4.84019L101.706 21.6515H99.2565L101.581 16.0892L97.0772 4.84019H99.7131L102.93 13.5571L106.272 4.84019H108.721Z"
                          fill="currentColor"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
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
            class="fixed top-0 right-0 left-0 lg:left-64 lg:h-24 px-5 lg:px-4 pt-6 lg:pb-4 lg:ml-1.5 lg:border-b border-light-border dark:border-dark-border bg-light-bg-secondary dark:bg-dark-bg-secondary z-40"
          >
            <!-- Mobile Header -->
            <div
              class="h-10 justify-between items-center inline-flex lg:hidden w-full"
            >
              {#if !showMobileSearch}
                <div class="w-[125.33px] h-[38px] relative">
                  <a href="/">
                    <div class="flex justify-start items-center">
                      <!-- //logo icon -->
                      <img
                        src="/YV.svg"
                        alt="Youversity Logo"
                        class="w-[35.29px] h-[38px] lg:w-[44.97px] lg:h-[48.43px]"
                      />
            
                      <div class="pt-2">
                        <!-- //logo text -->
                        <svg
                          class="w-[86.61px] h-[16.76px] lg:w-[107.83px] lg:h-[21.36px] text-light-text-primary dark:text-dark-text-primary"
                          viewBox="0 0 109 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <g id="Youversity">
                            <path
                              d="M12.8206 1.85152L8.04707 11.0458V16.276H5.68104V11.0458L0.886719 1.85152H3.52256L6.86406 8.92886L10.2056 1.85152H12.8206Z"
                              fill="currentColor"
                            />
                            <path
                              d="M19.6587 16.4628C18.5794 16.4628 17.6039 16.2207 16.7322 15.7364C15.8605 15.2383 15.1756 14.5465 14.6775 13.6609C14.1794 12.7616 13.9304 11.7238 13.9304 10.5477C13.9304 9.38546 14.1863 8.35465 14.6983 7.45528C15.2102 6.55591 15.909 5.86409 16.7945 5.37981C17.68 4.89554 18.6693 4.6534 19.7624 4.6534C20.8555 4.6534 21.8448 4.89554 22.7303 5.37981C23.6159 5.86409 24.3146 6.55591 24.8266 7.45528C25.3385 8.35465 25.5945 9.38546 25.5945 10.5477C25.5945 11.71 25.3316 12.7408 24.8058 13.6402C24.28 14.5395 23.5605 15.2383 22.6473 15.7364C21.748 16.2207 20.7517 16.4628 19.6587 16.4628ZM19.6587 14.4081C20.2675 14.4081 20.8347 14.2628 21.3605 13.9722C21.9002 13.6817 22.336 13.2458 22.6681 12.6647C23.0001 12.0836 23.1662 11.3779 23.1662 10.5477C23.1662 9.71754 23.0071 9.0188 22.6888 8.4515C22.3706 7.87037 21.9486 7.43452 21.4228 7.14396C20.897 6.85339 20.3297 6.70811 19.7209 6.70811C19.1121 6.70811 18.5448 6.85339 18.019 7.14396C17.5071 7.43452 17.0989 7.87037 16.7945 8.4515C16.4901 9.0188 16.3379 9.71754 16.3379 10.5477C16.3379 11.7792 16.6492 12.7339 17.2719 13.4119C17.9083 14.076 18.7039 14.4081 19.6587 14.4081Z"
                              fill="currentColor"
                            />
                            <path
                              d="M38.29 4.84019V16.276H35.924V14.927C35.5504 15.3974 35.0592 15.771 34.4504 16.0477C33.8554 16.3106 33.2189 16.442 32.541 16.442C31.6416 16.442 30.8322 16.2552 30.1127 15.8817C29.407 15.5081 28.8466 14.9546 28.4315 14.2213C28.0303 13.488 27.8297 12.6024 27.8297 11.5647V4.84019H30.1749V11.2119C30.1749 12.2358 30.4309 13.0244 30.9429 13.5779C31.4548 14.1175 32.1535 14.3873 33.0391 14.3873C33.9246 14.3873 34.6233 14.1175 35.1353 13.5779C35.6611 13.0244 35.924 12.2358 35.924 11.2119V4.84019H38.29Z"
                              fill="currentColor"
                            />
                            <path
                              d="M45.8325 14.159L49.0703 4.84019H51.5816L47.2231 16.276H44.4005L40.0627 4.84019H42.5948L45.8325 14.159Z"
                              fill="currentColor"
                            />
                            <path
                              d="M63.8511 10.2779C63.8511 10.7068 63.8235 11.0943 63.7681 11.4402H55.0304C55.0996 12.3534 55.4386 13.0867 56.0474 13.6402C56.6562 14.1936 57.4034 14.4704 58.2889 14.4704C59.5618 14.4704 60.4612 13.9376 60.987 12.8722H63.5398C63.1939 13.9238 62.5643 14.7886 61.6511 15.4666C60.7518 16.1307 59.631 16.4628 58.2889 16.4628C57.1958 16.4628 56.2134 16.2207 55.3417 15.7364C54.4839 15.2383 53.8059 14.5465 53.3078 13.6609C52.8235 12.7616 52.5814 11.7238 52.5814 10.5477C52.5814 9.37162 52.8166 8.34081 53.287 7.45528C53.7713 6.55591 54.4424 5.86409 55.3002 5.37981C56.1719 4.89554 57.1681 4.6534 58.2889 4.6534C59.3681 4.6534 60.3298 4.88862 61.1738 5.35906C62.0178 5.8295 62.675 6.49365 63.1455 7.3515C63.6159 8.19553 63.8511 9.171 63.8511 10.2779ZM61.3813 9.53074C61.3675 8.65905 61.0562 7.96031 60.4474 7.43452C59.8386 6.90874 59.0845 6.64585 58.1851 6.64585C57.3688 6.64585 56.67 6.90874 56.0889 7.43452C55.5078 7.94647 55.1619 8.64521 55.0512 9.53074H61.3813Z"
                              fill="currentColor"
                            />
                            <path
                              d="M68.5456 6.50056C68.8915 5.91943 69.3481 5.46975 69.9154 5.15151C70.4965 4.81944 71.1814 4.6534 71.9701 4.6534V7.10245H71.3682C70.4412 7.10245 69.7355 7.33767 69.2512 7.80811C68.7808 8.27855 68.5456 9.0949 68.5456 10.2572V16.276H66.1796V4.84019H68.5456V6.50056Z"
                              fill="currentColor"
                            />
                            <path
                              d="M78.2959 16.4628C77.3965 16.4628 76.5871 16.3037 75.8676 15.9854C75.1619 15.6534 74.6016 15.2106 74.1865 14.6571C73.7714 14.0898 73.55 13.4603 73.5223 12.7685H75.9714C76.0129 13.2527 76.2412 13.6609 76.6563 13.993C77.0852 14.3112 77.6179 14.4704 78.2544 14.4704C78.9185 14.4704 79.4305 14.3458 79.7902 14.0968C80.1638 13.8339 80.3506 13.5018 80.3506 13.1005C80.3506 12.6716 80.1431 12.3534 79.728 12.1458C79.3267 11.9383 78.6833 11.71 77.7978 11.4609C76.9399 11.2257 76.2412 10.9974 75.7016 10.776C75.1619 10.5546 74.6915 10.2156 74.2902 9.75904C73.9028 9.30244 73.7091 8.70056 73.7091 7.95339C73.7091 7.34459 73.889 6.79113 74.2487 6.29302C74.6085 5.78107 75.1204 5.37981 75.7846 5.08925C76.4626 4.79868 77.2374 4.6534 78.1091 4.6534C79.4097 4.6534 80.4544 4.98547 81.243 5.64962C82.0456 6.29993 82.4745 7.19238 82.5298 8.32697H80.1638C80.1223 7.81502 79.9147 7.40685 79.5412 7.10245C79.1676 6.79805 78.6626 6.64585 78.0261 6.64585C77.4034 6.64585 76.9261 6.76346 76.594 6.99867C76.2619 7.23389 76.0959 7.54521 76.0959 7.93263C76.0959 8.23704 76.2066 8.49301 76.428 8.70056C76.6494 8.9081 76.9192 9.07414 77.2374 9.19867C77.5556 9.30936 78.0261 9.45464 78.6487 9.63452C79.4789 9.8559 80.1569 10.0842 80.6827 10.3194C81.2223 10.5408 81.6858 10.8729 82.0732 11.3156C82.4606 11.7584 82.6613 12.3465 82.6751 13.0798C82.6751 13.7301 82.4952 14.3112 82.1355 14.8232C81.7757 15.3351 81.2638 15.7364 80.5996 16.0269C79.9493 16.3175 79.1814 16.4628 78.2959 16.4628Z"
                              fill="currentColor"
                            />
                            <path
                              d="M86.4354 3.3251C86.0065 3.3251 85.6468 3.17982 85.3562 2.88925C85.0656 2.59869 84.9203 2.23894 84.9203 1.81001C84.9203 1.38108 85.0656 1.02133 85.3562 0.73077C85.6468 0.440205 86.0065 0.294922 86.4354 0.294922C86.8505 0.294922 87.2034 0.440205 87.4939 0.73077C87.7845 1.02133 87.9298 1.38108 87.9298 1.81001C87.9298 2.23894 87.7845 2.59869 87.4939 2.88925C87.2034 3.17982 86.8505 3.3251 86.4354 3.3251ZM87.5977 4.84019V16.276H85.2317V4.84019H87.5977Z"
                              fill="currentColor"
                            />
                            <path
                              d="M93.4645 6.77037V13.1005C93.4645 13.5295 93.5613 13.8408 93.755 14.0345C93.9626 14.2144 94.3085 14.3043 94.7927 14.3043H96.2456V16.276H94.3777C93.3123 16.276 92.4959 16.0269 91.9286 15.5288C91.3613 15.0307 91.0777 14.2213 91.0777 13.1005V6.77037H89.7286V4.84019H91.0777V1.9968H93.4645V4.84019H96.2456V6.77037H93.4645Z"
                              fill="currentColor"
                            />
                            <path
                              d="M108.721 4.84019L101.706 21.6515H99.2565L101.581 16.0892L97.0772 4.84019H99.7131L102.93 13.5571L106.272 4.84019H108.721Z"
                              fill="currentColor"
                            />
                          </g>
                        </svg>
                      </div>
                    </div>
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
