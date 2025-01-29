<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { signInWithGoogle, signInWithEmail, registerWithEmail, resetPassword } from '$lib/services/auth';
  import { page } from '$app/stores';
  import OnboardingCarousel from '$lib/components/OnboardingCarousel.svelte';

  let error: string | null = null;
  let successMessage: string | null = null;
  let isRegistering = false;
  let isResettingPassword = false;
  let firstName = '';
  let lastName = '';
  let email = '';
  let password = '';
  let showPassword = false;
  let passwordInput: HTMLInputElement;
  let termsAccepted = false;

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
    if (isRegistering) {
      if (!firstName || !lastName || !email || !password) {
        error = 'Please fill in all fields';
        return;
      }
      if (!termsAccepted) {
        error = 'Please accept the terms and policy';
        return;
      }
    } else {
      if (!email || !password) {
        error = 'Please fill in all fields';
        return;
      }
    }

    error = null;
    try {
      const redirectTo = $page.url.searchParams.get('redirectTo') || '/create-course';
      if (isRegistering) {
        try {
          await registerWithEmail(email, password, redirectTo, { firstName, lastName });
        } catch (err: any) {
          if (err?.message?.includes('auth/email-already-in-use')) {
            isRegistering = false;
            error = 'This email is already registered. Please sign in instead.';
            password = '';
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
    @apply block text-base font-medium text-black mb-2;
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

<div class="margin-safe-left flex justify-center items-start h-screen">
  <!-- Left Side - Login Form -->
  <div class="w-full flex flex-col items-start relative">
    <!-- Logo section -->
    <div class="w-[230px] px-5 xl:px-8 py-6 fixed top-0 left-0 z-10">
      <div class="w-[160px] h-[48.4px] relative">
        <a href="/">
          <img 
            src="/youversity-logo-large.svg" 
            alt="Youversity Logo" 
            class="left-0 top-0 absolute lg:block hidden"
          />
          <img 
            src="/youversity-logo-small.svg" 
            alt="Youversity Logo" 
            class="left-0 top-0 absolute lg:hidden block"
          />
        </a>
      </div>
    </div>

    <!-- Left Side - Form Container -->
    <div class="w-full flex items-center justify-center lg:w-[52%]">
      <div class="w-[390px] lg:w-[415px] mx-auto xl:px-4 pt-[120px]">
        {#if isRegistering}
          <!-- Sign Up Form -->
          <div class="flex-col justify-start items-start gap-8 inline-flex w-full">
            <div class="self-stretch h-[76px] lg:h-auto flex-col justify-start items-start gap-2 flex">
              <!-- Back Button - Mobile Only -->
              <button 
                on:click={() => window.history.back()} 
                class="lg:hidden w-6 h-6"
              >
                <img 
                  src="/icons/arrow-left.svg" 
                  alt="Go back" 
                  class="w-6 h-6"
                />
              </button>
              <div class="self-stretch text-black text-4xl font-medium font-['Poppins'] leading-[44px]">Get Started Now</div>
            </div>

            <div class="self-stretch flex-col justify-start items-start gap-8 flex">
              <form on:submit|preventDefault={handleEmailAuth} class="self-stretch flex-col justify-start items-center gap-8 flex">
                <div class="self-stretch flex-col justify-start items-start gap-6 flex">
                  <div class="self-stretch flex-col justify-start items-start gap-5 flex">
                    <!-- Name Fields -->
                    <div class="self-stretch flex-col justify-start items-start gap-1 flex">
                      <div class="justify-start items-start gap-2.5 inline-flex">
                        <div class="semibody-medium">Name</div>
                      </div>
                      <div class="self-stretch justify-start items-start gap-2 inline-flex">
                        <input
                          type="text"
                          placeholder="First name"
                          bind:value={firstName}
                          class="grow shrink basis-0 form-input"
                        />
                        <input
                          type="text"
                          placeholder="Last name"
                          bind:value={lastName}
                          class="grow shrink basis-0 form-input"
                        />
                      </div>
                    </div>

                    <!-- Email Field -->
                    <div class="self-stretch flex-col justify-start items-start gap-1 flex">
                      <div class="justify-start items-start gap-2.5 inline-flex">
                        <div class="semibody-medium">Email address</div>
                      </div>
                      <input
                        type="email"
                        bind:value={email}
                        placeholder="Enter email address"
                        class="self-stretch form-input"
                      />
                    </div>

                    <!-- Password Field -->
                    <div class="self-stretch flex-col justify-start items-start gap-1 flex">
                      <div class="justify-start items-start gap-2.5 inline-flex">
                        <div class="semibody-medium">Password</div>
                      </div>
                      <div class="self-stretch h-12 pl-4 pr-2 py-2 form-input flex justify-between items-center">
                        <input
                          bind:this={passwordInput}
                          type="password"
                          bind:value={password}
                          placeholder="Enter password"
                          class="grow border-none focus:outline-none"
                        />
                        <button
                          type="button"
                          class="w-6 h-6"
                          on:click={togglePasswordVisibility}
                        >
                          <img 
                            src={showPassword ? "/icons/view-off-slash.svg" : "/icons/view.svg"} 
                            alt={showPassword ? "Hide password" : "Show password"}
                            class="w-6 h-6"
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Terms Checkbox -->
                  <div class="justify-start items-center gap-1 inline-flex">
                    <input
                      type="checkbox"
                      id="terms"
                      bind:checked={termsAccepted}
                      class="w-6 h-6 hidden"
                    />
                    <label for="terms" class="flex items-center gap-1 cursor-pointer">
                      <div class="w-6 h-6 relative">
                        <img 
                          src={termsAccepted ? "/icons/checkmark-square-active.svg" : "/icons/checkmark-square-inactive.svg"}
                          alt="Terms checkbox"
                          class="w-6 h-6"
                        />
                      </div>
                      <span class="semi-body">
                        I agree to the <a href="/terms" class="text-[#eb434a] underline">terms & policy</a>
                      </span>
                    </label>
                  </div>
                </div>

                <!-- Main sign up/sign in buttons -->
                <Button type="submit" variant="primary" fullWidth textClass="text-body">
                  {isRegistering ? 'Sign up' : 'Sign in'}
                </Button>
              </form>

              <!-- Social Sign Up -->
              <div class="self-stretch flex-col justify-start items-center gap-8 flex">
                <div class="h-10 justify-center items-center gap-4 inline-flex w-full">
                  <div 
                    role="button"
                    tabindex="0"
                    on:click={handleSignIn}
                    on:keydown={(e) => e.key === 'Enter' && handleSignIn()}
                    class="grow shrink basis-0 px-4 py-2 rounded-[10px] border border-black/5 flex-col justify-center items-center gap-2.5 inline-flex overflow-hidden hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
                  >
                    <div class="justify-start items-center gap-2.5 inline-flex w-full">
                      <div class="w-6 h-6 relative overflow-hidden flex-shrink-0">
                        <img src="/google-icon.svg" alt="Google" class="w-full h-full" />
                      </div>
                      <div class="text-black text-xs font-medium font-['Poppins'] whitespace-nowrap">
                        Sign {isRegistering ? 'up' : 'in'} with Google
                      </div>
                    </div>
                  </div>
                  <div 
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && null}
                    class="grow shrink basis-0 px-4 py-2 rounded-[10px] border border-black/5 flex-col justify-center items-center gap-2.5 inline-flex overflow-hidden hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
                  >
                    <div class="justify-center items-center gap-2.5 inline-flex w-full">
                      <div class="w-6 h-6 relative overflow-hidden flex-shrink-0">
                        <img src="/apple-icon.svg" alt="Apple" class="w-full h-full" />
                      </div>
                      <div class="text-black text-xs font-medium font-['Poppins'] whitespace-nowrap">
                        Sign {isRegistering ? 'up' : 'in'} with Apple
                      </div>
                    </div>
                  </div>
                </div>
                <div class="self-stretch text-center">
                  <span class="semi-body">Already have account? </span>
                  <button
                    type="button"
                    on:click={() => switchMode('signin')}
                    class="text-[#eb434a] semi-body underline leading-snug"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <!-- Login Form -->
          <div class="flex-col justify-start items-start gap-[50px] lg:gap-8 inline-flex w-full">
            <div class="self-stretch h-[116px] lg:h-[84px] flex-col justify-start items-start gap-4 flex">
              <!-- Back Button - Mobile Only -->
              <button 
                on:click={() => window.history.back()} 
                class="lg:hidden w-6 h-6 mb-2"
              >
                <img 
                  src="/icons/arrow-left.svg" 
                  alt="Go back" 
                  class="w-6 h-6"
                />
              </button>
              <div class="self-stretch h2">Login</div>
              <div class="self-stretch text-Grey body">Welcome back!</div>
            </div>

            <div class="self-stretch flex-col justify-start items-start gap-8 flex">
              <form on:submit|preventDefault={handleEmailAuth} class="self-stretch flex-col justify-start items-center gap-8 flex">
                <div class="self-stretch flex-col justify-start items-start gap-5 flex">
                  <!-- Email Field -->
                  <div class="self-stretch flex-col justify-start items-start gap-1 flex">
                    <div class="justify-start items-start gap-2.5 inline-flex">
                      <div class="text-black semibody-medium">Email address</div>
                    </div>
                    <input
                      type="email"
                      bind:value={email}
                      placeholder="Enter email address"
                      class="self-stretch form-input"
                    />
                  </div>

                  <!-- Password Field -->
                  <div class="self-stretch flex-col justify-start items-start gap-1 flex">
                    <div class="justify-start items-start gap-2.5 inline-flex">
                      <div class="semibody-medium">Password</div>
                    </div>
                    <div class="self-stretch flex-col justify-start items-start gap-4 flex">
                      <div class="self-stretch form-input flex justify-between items-center">
                        <input
                          bind:this={passwordInput}
                          type="password"
                          bind:value={password}
                          placeholder="Enter password"
                          class="grow bg-transparent border-none focus:outline-none"
                        />
                        <button
                          type="button"
                          class="w-6 h-6"
                          on:click={togglePasswordVisibility}
                        >
                          <img 
                            src={showPassword ? "/icons/view-off-slash.svg" : "/icons/view.svg"} 
                            alt={showPassword ? "Hide password" : "Show password"}
                            class="w-6 h-6"
                          />
                        </button>
                      </div>
                      <button
                        type="button"
                        on:click={() => switchMode('reset')}
                        class="px-6 text-[#eb434a] semi-body underline leading-snug"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Main sign up/sign in buttons -->
                <Button type="submit" variant="primary" fullWidth textClass="body">
                  {isRegistering ? 'Sign up' : 'Sign in'}
                </Button>
              </form>

              <!-- Social Login -->
              <div class="self-stretch flex-col justify-start items-center gap-8 flex">
                <div class="h-10 justify-center items-center gap-4 inline-flex w-full">
                  <div 
                    role="button"
                    tabindex="0"
                    on:click={handleSignIn}
                    on:keydown={(e) => e.key === 'Enter' && handleSignIn()}
                    class="grow shrink basis-0 px-4 py-2 rounded-[10px] border border-black/5 flex-col justify-center items-center gap-2.5 inline-flex overflow-hidden hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
                  >
                    <div class="justify-start items-center gap-2.5 inline-flex w-full">
                      <div class="w-6 h-6 relative overflow-hidden flex-shrink-0">
                        <img src="/google-icon.svg" alt="Google" class="w-full h-full" />
                      </div>
                      <div class="text-black text-xs font-medium font-['Poppins'] whitespace-nowrap">
                        Sign {isRegistering ? 'up' : 'in'} with Google
                      </div>
                    </div>
                  </div>
                  <div 
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && null}
                    class="grow shrink basis-0 px-4 py-2 rounded-[10px] border border-black/5 flex-col justify-center items-center gap-2.5 inline-flex overflow-hidden hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
                  >
                    <div class="justify-center items-center gap-2.5 inline-flex w-full">
                      <div class="w-6 h-6 relative overflow-hidden flex-shrink-0">
                        <img src="/apple-icon.svg" alt="Apple" class="w-full h-full" />
                      </div>
                      <div class="text-black text-xs font-medium font-['Poppins'] whitespace-nowrap">
                        Sign {isRegistering ? 'up' : 'in'} with Apple
                      </div>
                    </div>
                  </div>
                </div>
                <div class="self-stretch text-center">
                  <span class="text-black semi-body">Don't have an account? </span>
                  <button
                    type="button"
                    on:click={() => switchMode('register')}
                    class="text-[#eb434a] semi-body underline leading-snug"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Right Side - Content -->
    <div class="hidden lg:flex w-[48%] fixed right-0 top-0 bottom-0 flex-col justify-center items-center bg-black/5 rounded-[64px_0_0_64px]">
      <OnboardingCarousel />
    </div>
  </div>
</div>