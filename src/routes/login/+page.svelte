<script lang="ts">
  import { signInWithGoogle, signInWithEmail, registerWithEmail } from '$lib/services/auth';
  import { page } from '$app/stores';

  let error: string | null = null;
  let isRegistering = false;
  let email = '';
  let password = '';
  let confirmPassword = '';

  function getReadableErrorMessage(err: any): string {
    if (!(err instanceof Error)) return 'Authentication failed';
    
    const errorCode = err.message.match(/\(([^)]+)\)/)?.[1] || '';
    
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'Email is already registered';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      default:
        return 'Authentication failed. Please try again';
    }
  }

  async function handleSignIn() {
    try {
      const redirectTo = $page.url.searchParams.get('redirectTo') || '/create-course';
      await signInWithGoogle(redirectTo);
    } catch (err) {
      console.error('Sign in error:', err);
      error = getReadableErrorMessage(err);
    }
  }

  async function handleEmailAuth() {
    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    error = null;
    try {
      const redirectTo = $page.url.searchParams.get('redirectTo') || '/create-course';
      if (isRegistering) {
        await registerWithEmail(email, password, redirectTo);
      } else {
        await signInWithEmail(email, password, redirectTo);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      error = getReadableErrorMessage(err);
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
  <div class="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
    <h1 class="text-3xl font-bold text-center mb-8">{isRegistering ? 'Create Account' : 'Sign In'} to Youversity</h1>
    
    {#if error}
      <div class="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleEmailAuth} class="space-y-4 mb-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your password"
          required
        />
      </div>

      {#if isRegistering}
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            bind:value={confirmPassword}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm your password"
            required
          />
        </div>
      {/if}

      <button
        type="submit"
        class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        {isRegistering ? 'Create Account' : 'Sign In'}
      </button>
    </form>

    <div class="text-center mb-6">
      <button
        on:click={() => {
          error = null;
          isRegistering = !isRegistering;
        }}
        class="text-blue-600 hover:text-blue-700 text-sm"
      >
        {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Create one'}
      </button>
    </div>

    <div class="relative mb-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-gray-500">Or continue with</span>
      </div>
    </div>

    <button
      on:click={handleSignIn}
      class="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-3"
    >
      <img src="/google-icon.svg" alt="Google" class="w-6 h-6" />
      Continue with Google
    </button>
  </div>
</div> 