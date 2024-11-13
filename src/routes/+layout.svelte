<script lang="ts">
  import { page } from '$app/stores';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import { signInWithGoogle, signOutUser } from '$lib/services/auth';
  import CourseGenerationProgress from '$lib/components/CourseGenerationProgress.svelte';
  import { 
    Home,
    TrendingUp,
    Settings,
    LogOut,
    Search,
    Bell,
    PlusCircle,
    User
  } from 'lucide-svelte';
  import '../app.css';

  // Sidebar items configuration
  const sidebarItems = [
    { icon: Home, label: 'Home', href: '/', isActive: true },
    { icon: TrendingUp, label: 'Trending', href: '/trending', isActive: false },
    { icon: User, label: 'My Profile', href: '/profile', isActive: false },
    { icon: Settings, label: 'Settings', href: '/settings', isActive: false },
  ];

  let menuOpen = false;
  let searchQuery = '';

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  async function handleAuth() {
    if ($user) {
      await signOutUser();
    } else {
      await signInWithGoogle();
    }
  }
</script>

<div class="min-h-screen bg-[#F5F5F5] font-sans">
  <div class="flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white h-screen sticky top-0 shadow-md z-10">
      <div class="flex items-center justify-center h-16 border-b border-[#D9E1E3]">
        <a href="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-full bg-[#EE434A] flex items-center justify-center">
            <img src="/favicon.png" alt="Logo" class="w-6 h-6" />
          </div>
          <span class="text-xl font-bold text-[#2A4D61]">YouVersity</span>
        </a>
      </div>

      <nav class="mt-8">
        {#each sidebarItems as item}
          <a 
            href={item.href} 
            class="flex items-center px-6 py-3 transition-colors {
              $page.url.pathname === item.href 
                ? 'bg-[#EE434A] text-white' 
                : 'text-[#2A4D61] hover:bg-[#F5F5F5]'
            }"
          >
            <svelte:component 
              this={item.icon} 
              class="w-5 h-5 mr-3" 
            />
            {item.label}
          </a>
        {/each}

        <button 
          class="w-full flex items-center px-6 py-3 text-[#2A4D61] hover:text-[#EE434A] hover:bg-[#F5F5F5]"
        >
          <PlusCircle class="w-5 h-5 mr-3" />
          Add Course
        </button>
      </nav>

      <div class="absolute bottom-0 w-full p-4">
        <button 
          on:click={handleAuth}
          class="w-full flex items-center px-6 py-3 text-[#2A4D61] hover:text-[#EE434A]"
        >
          <LogOut class="w-5 h-5 mr-3" />
          {$user ? 'Sign Out' : 'Sign In'}
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1">
      <!-- Header -->
      <header class="bg-white shadow-sm p-4 flex justify-between items-center">
        <div class="relative w-1/2">
          <input
            type="text"
            placeholder="Search courses..."
            bind:value={searchQuery}
            class="w-full pl-10 py-2 pr-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EE434A]"
          />
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        <div class="flex items-center space-x-4">
          <button class="relative p-2 hover:bg-gray-100 rounded-full">
            <Bell class="w-5 h-5" />
            <span class="absolute top-0 right-0 w-2 h-2 bg-[#42C1C8] rounded-full"></span>
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
      <div class="p-8">
        <slot />
      </div>
    </main>
  </div>
</div>

<CourseGenerationProgress />

<style>
  :global(body) {
    @apply antialiased;
  }
</style>