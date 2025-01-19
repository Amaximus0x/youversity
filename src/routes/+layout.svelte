<script lang="ts">
  import { page } from '$app/stores';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import { signOutUser } from '$lib/services/auth';
  import CourseGenerationProgress from '$lib/components/CourseGenerationProgress.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { theme } from '$lib/stores/theme';
  import { 
    Search,
    Bell,
    PlusCircle,
    User,
    Plus
  } from 'lucide-svelte';
  import '../app.css';
  import { goto } from '$app/navigation';
  import NoInternet from '$lib/components/NoInternet.svelte';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import FilterModal from '$lib/components/FilterModal.svelte';

  let isSearchPage = false;
  let isMounted = false;
  let showFilterModal = false;
  
  onMount(() => {
    isMounted = true;
  });
  
  // Update isSearchPage only after component is mounted
  $: if (isMounted) {
    isSearchPage = $page.url.pathname === '/search';
  }

  // Sidebar items configuration
  const sidebarItems = [
    { icon: '/icons/home.svg', label: 'Home', href: '/', isActive: true },
    { icon: '/icons/fire-02.svg', label: 'Trending', href: '#trending-courses', isActive: false },
    { icon: '/icons/video-replay.svg', label: 'My Courses', href: '/my-courses', isActive: false },
    { icon: '/icons/bookmark-03.svg', label: 'Bookmarks', href: '/bookmarks', isActive: false },
    { icon: '/icons/settings-02.svg', label: 'Settings', href: '/settings', isActive: false },
  ];

  // Mobile navigation items (simplified version of sidebar items)
  const mobileNavItems = [
    { icon: '/icons/home.svg', label: 'Home', href: '/' },
    { icon: '/icons/fire-02.svg', label: 'Trending', href: '#trending-courses' },
    { icon: '/icons/video-replay.svg', label: 'My Courses', href: '/my-courses' },
    { icon: '/icons/bookmark-03.svg', label: 'Bookmarks', href: '/bookmarks' },
    { icon: '/icons/settings-02.svg', label: 'Settings', href: '/settings' },
  ];

  let menuOpen = false;
  let searchQuery = '';
  let isOnline = true;
  let isSearchFocused = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  async function handleAuth() {
    if ($user) {
      await signOutUser();
    } else {
      const redirectTo = $page.url.pathname;
      goto(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
  }

  function handleAddCourse() {
    goto('/create-course');
  }

  function updateOnlineStatus() {
    isOnline = navigator.onLine;
  }

  function handleSearch(e: Event) {
    e.preventDefault();
    if (searchQuery.trim()) {
      goto(`/search?q=${encodeURIComponent(searchQuery)}&filter=relevance`);
    }
  }

  onMount(() => {
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful');
        })
        .catch((err) => {
          console.error('ServiceWorker registration failed:', err);
        });
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  });
</script>

{#if !isOnline}
  <div class="fixed inset-0 z-50">
    <NoInternet />
  </div>
{:else}
  <div class="min-h-screen bg-gradient-light dark:bg-gradient-dark transition-colors">
    {#if !$page.data.hideNav}
      <!-- Sidebar - hidden on mobile -->
      <aside class="w-[262px] py-4 fixed top-0 left-0 bottom-0 border-r border-light-border dark:border-dark-border  z-40 hidden lg:flex lg:flex-col transition-colors">
        <!-- Logo section -->
        <div class="w-[230px] flex flex-col items-start justify-center px-4">
          <a href="/" class="flex items-center gap-[7px] mt-2">
            <img 
              src="/favicon.png" 
              alt="Youversity Logo" 
              class="w-[45px] h-[48px] object-contain"
            />
            <span class="text-[21px] font-medium text-light-text-secondary dark:text-white transition-colors">YouVersity</span>
          </a>
        </div>

        <!-- Navigation section -->
        <nav class="py-6 flex-1">
          {#each sidebarItems as item}
            <a 
              href={item.href} 
              class="group flex items-center mx-4 mb-4 px-4 py-2 rounded-lg transition-all {
                $page.url.pathname === item.href 
                  ? 'text-brand-red font-semibold' 
                  : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-red'
              }"
            >
              <img 
                src={item.icon} 
                alt={item.label}
                style={$page.url.pathname === item.href 
                  ? 'filter: invert(45%) sepia(95%) saturate(1648%) hue-rotate(325deg) brightness(97%) contrast(91%);'
                  : ''
                }
                class="w-6 h-6 mr-4 transition-all {
                  $page.url.pathname === item.href
                    ? ''
                    : 'opacity-60 group-hover:opacity-100 group-hover:[filter:invert(45%)_sepia(95%)_saturate(1648%)_hue-rotate(325deg)_brightness(97%)_contrast(91%)]'
                }" 
              />
              <span class="text-light-text-primary dark:text-dark-text-primary">{item.label}</span>
            </a>
          {/each}
        </nav>

        <!-- Help Center Section -->
        <div class="px-4 pb-8">
          <div class="relative mt-[15px] flex flex-col items-start p-6 pb-4 gap-4 border border-light-border dark:border-dark-border rounded-2xl">
            <div class="flex flex-col items-center w-full gap-2">
              <div class="absolute -top-5 left-1/2 transform -translate-x-1/2 w-[40px] h-[40px] bg-brand-red rounded-full flex items-center justify-center">
                <img 
                  src="/icons/help-circle.svg" 
                  alt="Help"
                  class="w-8 h-8 text-white" 
                />
              </div>
              <h3 class="text-base font-semibold text-light-text-secondary dark:text-white mt-1">Help Center</h3>
            </div>
            <div class="flex flex-col items-center w-full">
              <p class="text-xs leading-tight text-dark-text-secondary text-center">
                Having Trouble carrying out<br />
                a task?<br />
                Please contact us
              </p>
              <a 
                href="/help"
                class="mt-4 w-full py-2 px-4 text-brand-red text-xs font-medium border border-brand-red rounded-lg hover:bg-[#FFF2F3] dark:hover:bg-dark-bg-secondary transition-colors text-center"
              >
                Go to help center
              </a>
            </div>
          </div>
        </div>

        <div class="border-t border-light-border dark:border-dark-border">
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
        </div>
      </aside>

      <!-- Main Content with Navigation -->
      <main class="lg:pl-64 min-h-screen">
        <!-- Header -->
        <header class="fixed top-0 right-0 left-0 lg:left-64 h-24 px-4 lg:pr-8 py-6 border-b border-light-border dark:border-dark-border bg-light-bg-primary/10 dark:bg-dark-bg-primary/10 backdrop-blur-[30px] z-50">
          <div class="flex justify-between items-center gap-8 w-full h-full max-w-7xl mx-auto">
            <div class="flex-1 max-w-[611px] mx-auto ml-0">
              <form on:submit={handleSearch} class="w-full flex items-center bg-light-bg-primary dark:bg-dark-bg-primary border-[1.5px] {
                isSearchFocused ? 'border-brand-red' : 'border-light-border dark:border-dark-border'
              } rounded-2xl h-12 transition-all duration-300 ease-in-out">
                <div 
                  class="transition-all duration-200 ease-in-out ml-4 {
                    isSearchFocused ? 'opacity-0 translate-x-[-10px]' : 'opacity-60'
                  }"
                >
                  <img 
                    src="/icons/search-01.svg" 
                    alt="Search"
                    class="w-6 h-6" 
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search Courses..."
                  bind:value={searchQuery}
                  on:focus={() => isSearchFocused = true}
                  on:blur={() => isSearchFocused = false}
                  class="flex-1 pl-2 pr-1 bg-transparent border-none focus:outline-none text-base text-[#A3A3A3] font-normal"
                />
                <div class="flex items-center pl-2 border-l border-[rgba(0,0,0,0.05)]">
                  <div class="relative w-[106px] h-[36px]">
                    {#if isMounted && isSearchPage}
                      <div class="absolute inset-0 transition-colors duration-300 ease-in-out" 
                           in:fade={{ duration: 200 }} 
                           out:fade={{ duration: 200 }}>
                        <button
                          type="button"
                          on:click={() => showFilterModal = true}
                          class="flex items-center gap-2 px-2 py-[5px] border-[1.5px] border-[rgba(0,0,0,0.05)] rounded-2xl bg-white hover:bg-[#FFF2F3] transition-colors"
                        >
                          <img 
                            src="/icons/filter-icon.svg" 
                            alt="Filter"
                            class="w-6 h-6" 
                          />
                          <span class="text-base font-normal text-black">Filter</span>
                        </button>
                      </div>
                    {:else}
                      <div class="absolute inset-0 transition-colors duration-300 ease-in-out">
                        <button
                          type="submit"
                          class="flex items-center gap-2 px-2 py-[5px] border-[1.5px] border-[rgba(0,0,0,0.05)] rounded-2xl bg-white hover:bg-[#FFF2F3] transition-colors {
                            isSearchFocused ? 'border-[#EE434A] text-[#EE434A]' : ''
                          }"
                        >
                          <span class="text-base font-normal">Search</span>
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </form>
            </div>

            <div class="flex items-center gap-8">
              <div class="relative w-12 h-12 flex items-center justify-center border border-light-border dark:border-dark-border rounded-full">
                <ThemeToggle />
              </div>
              
              {#if $user}
                <div class="w-12 h-12 rounded-full bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border overflow-hidden">
                  <img 
                    src={$user.photoURL || ''} 
                    alt={$user.displayName || 'User'} 
                    class="w-full h-full object-cover"
                  />
                </div>
              {/if}
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="pt-32 px-4 lg:px-8">
          <slot />
        </div>

        <!-- Mobile Bottom Navigation -->
        <nav class="fixed bottom-0 left-0 right-0 h-16 border-t border-light-border dark:border-dark-border bg-light-bg-primary dark:bg-dark-bg-primary z-50 lg:hidden">
          <div class="flex justify-around items-center h-16">
            {#each mobileNavItems as item}
              <a 
                href={item.href}
                class="flex flex-col items-center justify-center flex-1 h-full text-xs py-1
                  {$page.url.pathname === item.href 
                    ? 'text-[#EE434A]' 
                    : 'text-[#2A4D61]'}"
              >
                <img 
                  src={item.icon}
                  alt={item.label}
                  style={$page.url.pathname === item.href ? 'filter: invert(45%) sepia(95%) saturate(1648%) hue-rotate(325deg) brightness(97%) contrast(91%);' : ''}
                  class="w-6 h-6 mb-1 {
                    $page.url.pathname === item.href
                      ? 'opacity-100'
                      : 'opacity-60'
                  }" 
                />
                <span>{item.label}</span>
              </a>
            {/each}
          </div>
        </nav>
      </main>
    {:else}
      <!-- Content without Navigation -->
      <main class="w-full">
        <slot />
      </main>
    {/if}
  </div>
{/if}

{#if !$page.url.pathname.startsWith('/create-course')}
  <CourseGenerationProgress />
{/if}

<FilterModal 
  show={showFilterModal}
  onClose={() => showFilterModal = false}
/>

<style>
  :global(body) {
    @apply antialiased;
  }

  /* Add backdrop blur to fixed elements while keeping background transparent */
  :global(.fixed) {
    @apply backdrop-blur-[2px];
  }
</style>