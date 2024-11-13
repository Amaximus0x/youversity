<script lang="ts">
  import { page } from '$app/stores';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import { signInWithGoogle, signOutUser } from '$lib/services/auth';
  import CourseGenerationProgress from '$lib/components/CourseGenerationProgress.svelte';
  import '../app.css';

  let menuOpen = false;

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

<nav class="bg-white shadow-lg fixed w-full top-0 z-50">
  <div class="max-w-7xl mx-auto px-4">
    <div class="flex justify-between items-center h-16">
      <div class="flex items-center">
        <a href="/" class="text-xl font-bold text-blue-600">Youversity</a>
      </div>

      <div class="hidden md:flex items-center space-x-4">
        {#if $isAuthenticated}
          <a 
            href="/create-course" 
            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md {$page.url.pathname === '/create-course' ? 'text-blue-600 font-medium' : ''}"
          >
            Create Course
          </a>
          <a 
            href="/my-courses" 
            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md {$page.url.pathname === '/my-courses' ? 'text-blue-600 font-medium' : ''}"
          >
            My Courses
          </a>
          <a 
            href="/profile" 
            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md {$page.url.pathname === '/profile' ? 'text-blue-600 font-medium' : ''}"
          >
            My Profile
          </a>
          <button 
            on:click={handleAuth}
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign Out
          </button>
        {:else}
          <button 
            on:click={handleAuth}
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        {/if}
      </div>

      <div class="md:hidden">
        <button 
          on:click={toggleMenu}
          class="text-gray-600 hover:text-gray-900"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</nav>

<CourseGenerationProgress />

<main class="pt-16">
  <slot />
</main>