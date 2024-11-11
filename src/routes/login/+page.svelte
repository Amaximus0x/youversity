<script lang="ts">
  import { signInWithGoogle } from '$lib/services/auth';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let error: string | null = null;

  async function handleSignIn() {
    try {
      const redirectTo = $page.url.searchParams.get('redirectTo') || '/create-course';
      await signInWithGoogle(redirectTo);
    } catch (err) {
      console.error('Sign in error:', err);
      error = err instanceof Error ? err.message : 'Failed to sign in';
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
  <div class="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
    <h1 class="text-3xl font-bold text-center mb-8">Sign In to Youversity</h1>
    
    {#if error}
      <div class="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
        {error}
      </div>
    {/if}

    <button
      on:click={handleSignIn}
      class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-3"
    >
      <img src="/google-icon.svg" alt="Google" class="w-6 h-6" />
      Continue with Google
    </button>
  </div>
</div> 