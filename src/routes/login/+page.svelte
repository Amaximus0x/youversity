<script lang="ts">
  import { signInWithGoogle, signInWithEmail, registerWithEmail, resetPassword } from '$lib/services/auth';
  import { page } from '$app/stores';
  import OnboardingCarousel from '$lib/components/OnboardingCarousel.svelte';

  let error: string | null = null;
  let successMessage: string | null = null;
  let isRegistering = false;
  let isResettingPassword = false;
  let email = '';
  let password = '';
  let confirmPassword = '';
  let showPassword = false;
  let passwordInput: HTMLInputElement;

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

  function togglePasswordVisibility() {
    showPassword = !showPassword;
    if (passwordInput) {
      passwordInput.type = showPassword ? 'text' : 'password';
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
        try {
          await registerWithEmail(email, password, redirectTo);
        } catch (err: any) {
          if (err?.message?.includes('auth/email-already-in-use')) {
            isRegistering = false;
            error = 'This email is already registered. Please sign in instead.';
            password = '';
            confirmPassword = '';
            return;
          }
          throw err;
        }
      } else {
        await signInWithEmail(email, password, redirectTo);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      error = getReadableErrorMessage(err);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      error = 'Please enter your email address';
      return;
    }

    error = null;
    successMessage = null;
    try {
      await resetPassword(email);
      successMessage = 'Password reset email sent. Please check your inbox.';
      isResettingPassword = false;
    } catch (err) {
      console.error('Password reset error:', err);
      error = getReadableErrorMessage(err);
    }
  }

  function switchMode(mode: 'signin' | 'register' | 'reset') {
    error = null;
    successMessage = null;
    isRegistering = mode === 'register';
    isResettingPassword = mode === 'reset';
  }
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
</svelte:head>

<style>
  .form-input {
    @apply w-full px-6 py-4 rounded-[16px] border-none focus:outline-none text-[#A3A3A3] text-base bg-white;
    box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.05);
  }
  
  .form-label {
    @apply block text-xl font-medium text-black mb-4;
  }

  .custom-checkbox {
    @apply hidden;
  }

  .custom-checkbox + label {
    @apply flex items-center gap-2 cursor-pointer;
  }

  .custom-checkbox + label::before {
    content: "";
    @apply inline-block w-5 h-5 bg-center bg-no-repeat;
    background-image: url('/icons/checkmark-square-inactive.svg');
  }

  .custom-checkbox:checked + label::before {
    background-image: url('/icons/checkmark-square-active.svg');
  }
</style>

<div class="min-h-screen bg-gradient-to-b from-[#FFF2F3] to-[#EDFEFF] flex">
  <!-- Left Side - Login Form -->
  <div class="w-full md:w-1/2 p-6 flex flex-col">
    <!-- Logo -->
    <div class="flex items-center mb-12">
      <img src="/YV.png" alt="YV Logo" class="w-[45px] h-[48px]" />
      <img src="/Youversity.svg" alt="Youversity" class="h-[26px] pt-[7px]" />
    </div>

    <!-- Form Container -->
    <div class="flex-1 flex items-start justify-center">
      <div class="w-full max-w-[460px] mx-auto">
        <h1 class="text-[36px] font-medium text-black mb-2">
          {isRegistering ? 'Get Started Now' : 'Login'}
        </h1>
        <p class="text-[#A3A3A3] text-base mb-8">
          {isRegistering ? '' : 'Welcome back!'}
        </p>

        {#if error}
          <div class="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        {/if}

        {#if successMessage}
          <div class="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
            {successMessage}
          </div>
        {/if}

        {#if isResettingPassword}
          <form on:submit|preventDefault={handlePasswordReset} class="space-y-6">
            <div>
              <label for="email" class="form-label">Email address</label>
              <input
                type="email"
                id="email"
                bind:value={email}
                class="form-input"
                placeholder="Enter email address"
              />
            </div>

            <button
              type="submit"
              class="w-full bg-brand-red hover:bg-[#D63B42] text-white py-3 rounded-lg transition-colors"
            >
              Send Reset Link
            </button>

            <button
              type="button"
              on:click={() => switchMode('signin')}
              class="w-full text-center text-brand-red hover:underline"
            >
              Back to Login
            </button>
          </form>
        {:else}
          <form on:submit|preventDefault={handleEmailAuth} class="space-y-6">
            {#if isRegistering}
              <div>
                <label class="form-label">Name</label>
                <div class="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    class="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    class="form-input"
                  />
                </div>
              </div>
            {/if}

            <div>
              <label for="email" class="form-label">Email address</label>
              <input
                type="email"
                id="email"
                bind:value={email}
                class="form-input"
                placeholder="Enter email address"
              />
            </div>

            <div class="relative">
              <label for="password" class="form-label">Password</label>
              <div class="relative">
                <input
                  bind:this={passwordInput}
                  type="password"
                  id="password"
                  bind:value={password}
                  class="form-input pr-12"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  class="absolute right-6 top-1/2 -translate-y-1/2"
                  on:click={togglePasswordVisibility}
                >
                  <img 
                    src={showPassword ? "/icons/view-off-slash.svg" : "/icons/view-off-slash.svg"} 
                    alt={showPassword ? "Hide password" : "Show password"}
                    class="w-5 h-5 opacity-50"
                  />
                </button>
              </div>
            </div>

            {#if isRegistering}
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  class="custom-checkbox"
                />
                <label for="terms" class="text-base">
                  I agree to the <a href="/terms" class="text-brand-red hover:underline">terms & policy</a>
                </label>
              </div>
            {/if}

            {#if !isRegistering}
              <div class="flex justify-start pl-6">
                <button
                  type="button"
                  on:click={() => switchMode('reset')}
                  class="text-brand-red text-base underline underline-offset-4 hover:text-[#D63B42] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            {/if}

            <button
              type="submit"
              class="w-full bg-brand-red hover:bg-[#D63B42] text-white py-4 rounded-[16px] transition-colors"
            >
              <span class="font-poppins text-base font-normal leading-6 tracking-[-0.16px]">
                {isRegistering ? 'Sign up' : 'Sign in'}
              </span>
            </button>

            <div class="flex items-center justify-center gap-3 my-6">
              <div class="h-[2px] bg-[#E5E7EB] flex-1"></div>
              <span class="text-base text-[#A3A3A3]">Or</span>
              <div class="h-[2px] bg-[#E5E7EB] flex-1"></div>
            </div>

            <div class="flex gap-4">
              <button
                type="button"
                on:click={handleSignIn}
                class="flex-1 flex items-center justify-center gap-2 py-4 border border-[#E5E7EB] rounded-[12px] hover:bg-white/50 transition-colors"
              >
                <img src="/google-icon.svg" alt="Google" class="w-5 h-5" />
                <span class="text-[#A3A3A3] text-base">Sign in with Google</span>
              </button>
              <button
                type="button"
                class="flex-1 flex items-center justify-center gap-2 py-4 border border-[#E5E7EB] rounded-[12px] hover:bg-white/50 transition-colors"
              >
                <img src="/apple-icon.svg" alt="Apple" class="w-5 h-5" />
                <span class="text-[#A3A3A3] text-base">Sign in with Apple</span>
              </button>
            </div>

            <div class="text-center">
              <span class="text-[#A3A3A3] text-base">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button
                type="button"
                on:click={() => switchMode(isRegistering ? 'signin' : 'register')}
                class="text-brand-red hover:underline ml-1 text-base"
              >
                {isRegistering ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>

  <!-- Right Side - Content -->
  <div class="hidden md:flex w-1/2 fixed right-0 top-0 bottom-0 flex-col justify-center items-center px-[79px] py-[75px] bg-black/5 rounded-[64px_0_0_64px]">
    <OnboardingCarousel />
  </div>

  <!-- Spacer div to maintain layout -->
  <div class="hidden md:block w-1/2"></div>

</div> 