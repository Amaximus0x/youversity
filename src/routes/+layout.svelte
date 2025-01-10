<script lang="ts">
  import { page } from '$app/stores';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import { signOutUser } from '$lib/services/auth';
  import CourseGenerationProgress from '$lib/components/CourseGenerationProgress.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
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
  <div class="min-h-screen bg-[#F5F5F5] font-sans">
    {#if !$page.data.hideNav}
      <!-- Sidebar - hidden on mobile -->
      <aside class="hidden md:block w-64 bg-white h-screen fixed top-0 left-0 border-r border-[#E8EAED] z-10 flex flex-col">
        <div class="flex items-center h-16 px-6 border-b border-[#E8EAED]">
          <a href="/" class="flex items-center space-x-3">
            <img 
              src="/favicon.png" 
              alt="Youversity Logo" 
              class="w-7 h-7 object-contain"
            />
            <span class="text-[15px] font-medium text-[#202124]">YouVersity</span>
          </a>
        </div>

        <nav class="py-6 flex-1">
          {#each sidebarItems as item}
            <a 
              href={item.href} 
              class="flex items-center mx-4 px-4 h-[44px] transition-colors rounded-lg {
                $page.url.pathname === item.href 
                  ? 'text-[#EE434A]' 
                  : 'text-[#5F6368] hover:bg-[#F8F9FA]'
              }"
            >
              <img 
                src={item.icon} 
                alt={item.label}
                style={$page.url.pathname === item.href ? 'filter: invert(45%) sepia(95%) saturate(1648%) hue-rotate(325deg) brightness(97%) contrast(91%);' : ''}
                class="w-5 h-5 mr-3 {
                  $page.url.pathname === item.href
                    ? 'opacity-100'
                    : 'opacity-60'
                }" 
              />
              <span class="text-[15px] font-normal">{item.label}</span>
            </a>
          {/each}
        </nav>

        <!-- Help Center Section -->
        <div class="px-4 pb-6">
          <div class="relative mt-[15px] flex flex-col items-start p-8 pb-4 gap-8 w-[198px] border border-[rgba(0,0,0,0.05)] rounded-2xl bg-white">
            <div class="flex flex-col items-center w-full gap-2">
              <img 
                src="/icons/help-circle.svg" 
                alt="Help"
                class="w-[42px] h-[42px] absolute -top-5 left-1/2 transform -translate-x-1/2" 
              />
              <h3 class="text-[15px] font-medium text-[#202124] mt-4">Help Center</h3>
            </div>
            <div class="flex flex-col items-center w-full">
              <p class="text-[13px] leading-5 text-[#5F6368] text-center">
                Having Trouble carrying out<br />
                a task?<br />
                Please contact us
              </p>
              <a 
                href="/help"
                class="mt-4 w-full py-2 px-4 text-[#EE434A] text-[13px] font-medium border border-[#EE434A] rounded-lg hover:bg-[#FFF2F3] transition-colors text-center"
              >
                Go to help center
              </a>
            </div>
          </div>
        </div>

        <div class="border-t border-[#E8EAED]">
          <button 
            on:click={handleAuth}
            class="flex items-center w-full px-8 h-[44px] text-[#5F6368] hover:bg-[#F8F9FA]"
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
      <main class="md:ml-64">
        <!-- Header -->
        <header class="bg-white border-b border-[#E8EAED] px-6 h-16 flex justify-between items-center fixed top-0 right-0 left-64 z-20">
          <div class="relative w-1/2">
            <form on:submit={handleSearch} class="w-full flex">
              <div class="relative flex-1">
                <input
                  type="text"
                  placeholder="Search courses..."
                  bind:value={searchQuery}
                  class="w-full pl-10 py-2 pr-4 rounded-l-lg bg-[#F5F5F5] border-none focus:outline-none focus:ring-2 focus:ring-[#EE434A] text-sm"
                />
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <button
                type="submit"
                class="px-4 py-2 bg-[#EE434A] text-white rounded-r-lg hover:bg-[#D93D44] transition-colors duration-200 flex items-center justify-center"
              >
                <Search class="w-5 h-5" />
              </button>
            </form>
          </div>

          <div class="flex items-center space-x-6">
            <button class="relative p-2 hover:bg-[#F5F5F5] rounded-full">
              <Bell class="w-5 h-5 text-[#2A4D61]" />
              <span class="absolute top-1 right-1 w-2 h-2 bg-[#42C1C8] rounded-full"></span>
            </button>
            
            {#if $user}
              <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                <img 
                  src={$user.photoURL || ''} 
                  alt={$user.displayName || 'User'} 
                  class="w-full h-full object-cover"
                />
              </div>
            {/if}
          </div>
        </header>

        <!-- Page Content -->
        <div class="p-8 mt-16">
          <slot />
        </div>

        <!-- Mobile Bottom Navigation -->
        <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
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

<CourseGenerationProgress />

<style>
  :global(body) {
    @apply antialiased;
  }
</style>