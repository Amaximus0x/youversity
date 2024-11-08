<script lang="ts">
  import "../app.css";
  import { user } from '$lib/stores/auth';
  import { signInWithGoogle, signOutUser } from '$lib/services/auth';
</script>

<div class="min-h-screen">
  <header class="bg-white shadow">
    <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <a href="/" class="text-3xl font-bold text-red-600">Youversity</a>
        
      </div>
      
      <div class="flex items-center gap-4">
        {#if $user}
          <a 
            href="/my-courses" 
            class="text-gray-600 hover:text-gray-900 ml-4"
          >
            My Courses
          </a>
        {/if}

        {#if $user}
          <a 
            href="/profile" 
            class="text-gray-600 hover:text-gray-900"
          >
            Profile
          </a>
          <button
            on:click={signOutUser}
            class="text-red-500 hover:text-red-700"
          >
            Sign out
          </button>
        {:else}
          <button
            on:click={() => signInWithGoogle()}
            class="text-blue-500 hover:text-blue-700"
          >
            Sign up with Google
          </button>
        {/if}
      </div>
    </nav>
  </header>

  <main class="container mx-auto px-4 py-8">
    <slot />
  </main>
</div>
