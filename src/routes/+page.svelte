<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { signInWithGoogle } from '$lib/services/auth';
  import { page } from '$app/stores';

  async function handleStartJourney() {
    try {
      const redirectTo = $page.url.searchParams.get('redirectTo') || '/create-course';
      
      if ($user) {
        window.location.href = redirectTo;
      } else {
        await signInWithGoogle(redirectTo);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }
</script>

<div class="text-center py-12 space-y-8">
  <h1 class="text-4xl font-bold">Welcome to Youversity</h1>
  
  <button
    on:click={handleStartJourney}
    class="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
  >
    {$user ? 'Continue to Course Creation' : 'Start with Google'}
  </button>
</div>
