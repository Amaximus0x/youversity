<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import {
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
  } from "$lib/services/auth";
  import { page } from "$app/stores";
  import { default as OnboardingCarousel } from "$lib/components/OnboardingCarousel.svelte";

  let error: string | null = null;
  let successMessage: string | null = null;
  let isRegistering = false;
  let isResettingPassword = false;
  let firstName = "";
  let lastName = "";
  let email = "";
  let password = "";
  let showPassword = false;
  let passwordInput: HTMLInputElement;
  let termsAccepted = false;
  let isLoading = false;
  let isGoogleLoading = false;

  function getReadableErrorMessage(err: any): string {
    if (!(err instanceof Error)) return "Authentication failed";
    
    const errorCode = err.message.match(/\(([^)]+)\)/)?.[1] || "";
    
    switch (errorCode) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password";
      case "auth/email-already-in-use":
        return "Email is already registered";
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is not enabled";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later";
      default:
        return "Authentication failed. Please try again";
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
    if (passwordInput) {
      passwordInput.type = showPassword ? "text" : "password";
    }
  }

  async function handleSignIn() {
    try {
      isGoogleLoading = true;
      const redirectTo = $page.url.searchParams.get("redirectTo") || "/";
      await signInWithGoogle(redirectTo);
    } catch (err) {
      console.error("Sign in error:", err);
      error = getReadableErrorMessage(err);
    } finally {
      isGoogleLoading = false;
    }
  }

  async function handleEmailAuth() {
    if (isRegistering) {
      if (!firstName || !lastName || !email || !password) {
        error = "Please fill in all fields";
        return;
      }
      if (!termsAccepted) {
        error = "Please accept the terms and policy";
        return;
      }
    } else {
      if (!email || !password) {
        error = "Please fill in all fields";
        return;
      }
    }

    error = null;
    isLoading = true;
    
    try {
      const redirectTo = $page.url.searchParams.get("redirectTo") || "/";
      if (isRegistering) {
        try {
          await registerWithEmail(email, password, redirectTo, {
            firstName,
            lastName,
          });
        } catch (err: any) {
          if (err?.message?.includes("auth/email-already-in-use")) {
            isRegistering = false;
            error = "This email is already registered. Please sign in instead.";
            password = "";
            return;
          }
          throw err;
        }
      } else {
        await signInWithEmail(email, password, redirectTo);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      error = getReadableErrorMessage(err);
    } finally {
      isLoading = false;
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      error = "Please enter your email address";
      return;
    }

    error = null;
    successMessage = null;
    isLoading = true;
    
    try {
      await resetPassword(email);
      successMessage = "Password reset email sent. Please check your inbox.";
      isResettingPassword = false;
    } catch (err) {
      console.error("Password reset error:", err);
      error = getReadableErrorMessage(err);
    } finally {
      isLoading = false;
    }
  }

  function switchMode(mode: "signin" | "register" | "reset") {
    error = null;
    successMessage = null;
    isRegistering = mode === "register";
    isResettingPassword = mode === "reset";
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class=" flex justify-center items-start h-screen">
  <!-- Left Side - Login Form -->
  <div class="margin-safe-left w-full flex flex-col items-start relative">
    <!-- Logo section -->
    <div
      class="w-full px-5  lg:px-8 py-6 fixed top-0 left-0 z-10"
    >
        <a href="/">
        <div class="flex justify-start items-center">
          <!-- //logo icon -->
          <img 
            src="/YV.svg"
            alt="Youversity Logo" 
            class="w-[35.29px] h-[38px] lg:w-[44.97px] lg:h-[48.43px]"
          />

          <div class="pt-2">
            <!-- //logo text -->
            <svg
              class="w-[86.61px] h-[16.76px] lg:w-[107.83px] lg:h-[21.36px] text-light-text-primary dark:text-dark-text-primary"
              viewBox="0 0 109 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <g id="Youversity">
                <path
                  d="M12.8206 1.85152L8.04707 11.0458V16.276H5.68104V11.0458L0.886719 1.85152H3.52256L6.86406 8.92886L10.2056 1.85152H12.8206Z"
                  fill="currentColor"
                />
                <path
                  d="M19.6587 16.4628C18.5794 16.4628 17.6039 16.2207 16.7322 15.7364C15.8605 15.2383 15.1756 14.5465 14.6775 13.6609C14.1794 12.7616 13.9304 11.7238 13.9304 10.5477C13.9304 9.38546 14.1863 8.35465 14.6983 7.45528C15.2102 6.55591 15.909 5.86409 16.7945 5.37981C17.68 4.89554 18.6693 4.6534 19.7624 4.6534C20.8555 4.6534 21.8448 4.89554 22.7303 5.37981C23.6159 5.86409 24.3146 6.55591 24.8266 7.45528C25.3385 8.35465 25.5945 9.38546 25.5945 10.5477C25.5945 11.71 25.3316 12.7408 24.8058 13.6402C24.28 14.5395 23.5605 15.2383 22.6473 15.7364C21.748 16.2207 20.7517 16.4628 19.6587 16.4628ZM19.6587 14.4081C20.2675 14.4081 20.8347 14.2628 21.3605 13.9722C21.9002 13.6817 22.336 13.2458 22.6681 12.6647C23.0001 12.0836 23.1662 11.3779 23.1662 10.5477C23.1662 9.71754 23.0071 9.0188 22.6888 8.4515C22.3706 7.87037 21.9486 7.43452 21.4228 7.14396C20.897 6.85339 20.3297 6.70811 19.7209 6.70811C19.1121 6.70811 18.5448 6.85339 18.019 7.14396C17.5071 7.43452 17.0989 7.87037 16.7945 8.4515C16.4901 9.0188 16.3379 9.71754 16.3379 10.5477C16.3379 11.7792 16.6492 12.7339 17.2719 13.4119C17.9083 14.076 18.7039 14.4081 19.6587 14.4081Z"
                  fill="currentColor"
                />
                <path
                  d="M38.29 4.84019V16.276H35.924V14.927C35.5504 15.3974 35.0592 15.771 34.4504 16.0477C33.8554 16.3106 33.2189 16.442 32.541 16.442C31.6416 16.442 30.8322 16.2552 30.1127 15.8817C29.407 15.5081 28.8466 14.9546 28.4315 14.2213C28.0303 13.488 27.8297 12.6024 27.8297 11.5647V4.84019H30.1749V11.2119C30.1749 12.2358 30.4309 13.0244 30.9429 13.5779C31.4548 14.1175 32.1535 14.3873 33.0391 14.3873C33.9246 14.3873 34.6233 14.1175 35.1353 13.5779C35.6611 13.0244 35.924 12.2358 35.924 11.2119V4.84019H38.29Z"
                  fill="currentColor"
                />
                <path
                  d="M45.8325 14.159L49.0703 4.84019H51.5816L47.2231 16.276H44.4005L40.0627 4.84019H42.5948L45.8325 14.159Z"
                  fill="currentColor"
                />
                <path
                  d="M63.8511 10.2779C63.8511 10.7068 63.8235 11.0943 63.7681 11.4402H55.0304C55.0996 12.3534 55.4386 13.0867 56.0474 13.6402C56.6562 14.1936 57.4034 14.4704 58.2889 14.4704C59.5618 14.4704 60.4612 13.9376 60.987 12.8722H63.5398C63.1939 13.9238 62.5643 14.7886 61.6511 15.4666C60.7518 16.1307 59.631 16.4628 58.2889 16.4628C57.1958 16.4628 56.2134 16.2207 55.3417 15.7364C54.4839 15.2383 53.8059 14.5465 53.3078 13.6609C52.8235 12.7616 52.5814 11.7238 52.5814 10.5477C52.5814 9.37162 52.8166 8.34081 53.287 7.45528C53.7713 6.55591 54.4424 5.86409 55.3002 5.37981C56.1719 4.89554 57.1681 4.6534 58.2889 4.6534C59.3681 4.6534 60.3298 4.88862 61.1738 5.35906C62.0178 5.8295 62.675 6.49365 63.1455 7.3515C63.6159 8.19553 63.8511 9.171 63.8511 10.2779ZM61.3813 9.53074C61.3675 8.65905 61.0562 7.96031 60.4474 7.43452C59.8386 6.90874 59.0845 6.64585 58.1851 6.64585C57.3688 6.64585 56.67 6.90874 56.0889 7.43452C55.5078 7.94647 55.1619 8.64521 55.0512 9.53074H61.3813Z"
                  fill="currentColor"
                />
                <path
                  d="M68.5456 6.50056C68.8915 5.91943 69.3481 5.46975 69.9154 5.15151C70.4965 4.81944 71.1814 4.6534 71.9701 4.6534V7.10245H71.3682C70.4412 7.10245 69.7355 7.33767 69.2512 7.80811C68.7808 8.27855 68.5456 9.0949 68.5456 10.2572V16.276H66.1796V4.84019H68.5456V6.50056Z"
                  fill="currentColor"
                />
                <path
                  d="M78.2959 16.4628C77.3965 16.4628 76.5871 16.3037 75.8676 15.9854C75.1619 15.6534 74.6016 15.2106 74.1865 14.6571C73.7714 14.0898 73.55 13.4603 73.5223 12.7685H75.9714C76.0129 13.2527 76.2412 13.6609 76.6563 13.993C77.0852 14.3112 77.6179 14.4704 78.2544 14.4704C78.9185 14.4704 79.4305 14.3458 79.7902 14.0968C80.1638 13.8339 80.3506 13.5018 80.3506 13.1005C80.3506 12.6716 80.1431 12.3534 79.728 12.1458C79.3267 11.9383 78.6833 11.71 77.7978 11.4609C76.9399 11.2257 76.2412 10.9974 75.7016 10.776C75.1619 10.5546 74.6915 10.2156 74.2902 9.75904C73.9028 9.30244 73.7091 8.70056 73.7091 7.95339C73.7091 7.34459 73.889 6.79113 74.2487 6.29302C74.6085 5.78107 75.1204 5.37981 75.7846 5.08925C76.4626 4.79868 77.2374 4.6534 78.1091 4.6534C79.4097 4.6534 80.4544 4.98547 81.243 5.64962C82.0456 6.29993 82.4745 7.19238 82.5298 8.32697H80.1638C80.1223 7.81502 79.9147 7.40685 79.5412 7.10245C79.1676 6.79805 78.6626 6.64585 78.0261 6.64585C77.4034 6.64585 76.9261 6.76346 76.594 6.99867C76.2619 7.23389 76.0959 7.54521 76.0959 7.93263C76.0959 8.23704 76.2066 8.49301 76.428 8.70056C76.6494 8.9081 76.9192 9.07414 77.2374 9.19867C77.5556 9.30936 78.0261 9.45464 78.6487 9.63452C79.4789 9.8559 80.1569 10.0842 80.6827 10.3194C81.2223 10.5408 81.6858 10.8729 82.0732 11.3156C82.4606 11.7584 82.6613 12.3465 82.6751 13.0798C82.6751 13.7301 82.4952 14.3112 82.1355 14.8232C81.7757 15.3351 81.2638 15.7364 80.5996 16.0269C79.9493 16.3175 79.1814 16.4628 78.2959 16.4628Z"
                  fill="currentColor"
                />
                <path
                  d="M86.4354 3.3251C86.0065 3.3251 85.6468 3.17982 85.3562 2.88925C85.0656 2.59869 84.9203 2.23894 84.9203 1.81001C84.9203 1.38108 85.0656 1.02133 85.3562 0.73077C85.6468 0.440205 86.0065 0.294922 86.4354 0.294922C86.8505 0.294922 87.2034 0.440205 87.4939 0.73077C87.7845 1.02133 87.9298 1.38108 87.9298 1.81001C87.9298 2.23894 87.7845 2.59869 87.4939 2.88925C87.2034 3.17982 86.8505 3.3251 86.4354 3.3251ZM87.5977 4.84019V16.276H85.2317V4.84019H87.5977Z"
                  fill="currentColor"
                />
                <path
                  d="M93.4645 6.77037V13.1005C93.4645 13.5295 93.5613 13.8408 93.755 14.0345C93.9626 14.2144 94.3085 14.3043 94.7927 14.3043H96.2456V16.276H94.3777C93.3123 16.276 92.4959 16.0269 91.9286 15.5288C91.3613 15.0307 91.0777 14.2213 91.0777 13.1005V6.77037H89.7286V4.84019H91.0777V1.9968H93.4645V4.84019H96.2456V6.77037H93.4645Z"
                  fill="currentColor"
                />
                <path
                  d="M108.721 4.84019L101.706 21.6515H99.2565L101.581 16.0892L97.0772 4.84019H99.7131L102.93 13.5571L106.272 4.84019H108.721Z"
                  fill="currentColor"
                />
              </g>
            </svg>
          </div>
        </div>
      </a>
    </div>

    <!-- Left Side - Form Container -->
    <div class="w-full flex items-center justify-center lg:w-[52%]">
      <div
        class="w-[390px] lg:w-[415px] mx-auto xl:px-4 pt-[112px] lg:pt-[151px] xl:pt-[151px]"
      >
        {#if isRegistering}
          <!-- Sign Up Form -->
          <div
            class="flex-col justify-start items-start gap-8 inline-flex w-full"
          >
            <div
              class="self-stretch h-[76px] lg:h-auto flex-col justify-start items-start gap-2 flex"
            >
              <!-- Back Button - Mobile Only -->
              <button 
                on:click={() => window.history.back()} 
                class="lg:hidden w-6 h-6"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  class="text-light-text-primary dark:text-dark-text-primary"
                >
                  <path
                    d="M4 12H20"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M8.99997 17C8.99997 17 4.00002 13.3176 4 12C3.99999 10.6824 9 7 9 7"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <div
                class="self-stretch text-light-text-primary dark:text-dark-text-primary text-h2"
              >
                Get Started Now
              </div>
            </div>

            <!-- Add Error and Success Messages -->
            {#if error}
              <div
                class="self-stretch p-4 bg-red-100 text-red-700 rounded-lg text-semi-body"
              >
                {error}
              </div>
            {/if}
            {#if successMessage}
              <div
                class="self-stretch p-4 bg-green-100 text-green-700 rounded-lg text-semi-body"
              >
                {successMessage}
              </div>
            {/if}

            <div
              class="self-stretch flex-col justify-start items-start gap-8 flex"
            >
              <form
                on:submit|preventDefault={handleEmailAuth}
                class="self-stretch flex-col justify-start items-center gap-8 flex"
              >
                <div
                  class="self-stretch flex-col justify-start items-start gap-6 flex"
                >
                  <div
                    class="self-stretch flex-col justify-start items-start gap-5 flex"
                  >
                    <!-- Name Fields -->
                    <div
                      class="self-stretch flex-col justify-start items-start gap-1 flex"
                    >
                      <div
                        class="justify-start items-start gap-2.5 inline-flex"
                      >
                        <div
                          class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium"
                        >
                          Name
                        </div>
                      </div>
                      <div
                        class="self-stretch justify-start items-start gap-2 inline-flex"
                      >
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
                    <div
                      class="self-stretch flex-col justify-start items-start gap-1 flex"
                    >
                      <div
                        class="justify-start items-start gap-2.5 inline-flex"
                      >
                        <div
                          class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium"
                        >
                          Email address
                        </div>
                      </div>
                      <input
                        type="email"
                        bind:value={email}
                        placeholder="Enter email address"
                        class="self-stretch form-input"
                      />
                    </div>

                    <!-- Password Field -->
                    <div
                      class="self-stretch flex-col justify-start items-start gap-1 flex"
                    >
                      <div
                        class="justify-start items-start gap-2.5 inline-flex"
                      >
                        <div
                          class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium"
                        >
                          Password
                        </div>
                      </div>
                      <div class="password-input-container">
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
                            src={showPassword
                              ? "/icons/view-off-slash.svg"
                              : "/icons/view.svg"}
                            alt={showPassword
                              ? "Hide password"
                              : "Show password"}
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
                    <label
                      for="terms"
                      class="flex items-center gap-1 cursor-pointer"
                    >
                      <div class="w-6 h-6 relative">
                        {#if termsAccepted}
                        <img 
                            src="/icons/checkmark-square-active.svg"
                          alt="Terms checkbox"
                          class="w-6 h-6"
                        />
                        {:else}
                          <svg
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-6 h-6 text-light-text-primary dark:text-dark-text-primary"
                          >
                            <path
                              d="M2.08301 9.99967C2.08301 6.26772 2.08301 4.40175 3.24237 3.24237C4.40175 2.08301 6.26772 2.08301 9.99967 2.08301C13.7316 2.08301 15.5976 2.08301 16.757 3.24237C17.9163 4.40175 17.9163 6.26772 17.9163 9.99967C17.9163 13.7316 17.9163 15.5976 16.757 16.757C15.5976 17.9163 13.7316 17.9163 9.99967 17.9163C6.26772 17.9163 4.40175 17.9163 3.24237 16.757C2.08301 15.5976 2.08301 13.7316 2.08301 9.99967Z"
                              stroke="currentColor"
                              stroke-opacity="0.2"
                              stroke-width="1.5"
                            />
                          </svg>
                        {/if}
                      </div>
                      <span
                        class="text-light-text-primary dark:text-dark-text-primary text-semi-body"
                      >
                        I agree to the <a
                          href="/terms"
                          class="text-brand-red underline">terms & policy</a
                        >
                      </span>
                    </label>
                  </div>
                </div>

                <!-- Main sign up/sign in buttons -->
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  textClass="text-body"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isRegistering ? "Sign up" : "Sign in"}
                </Button>
              </form>

              <!-- Social Sign Up -->
              <div
                class="self-stretch flex-col justify-start items-center gap-8 flex"
              >
                <div
                  class="h-10 justify-center items-center gap-4 inline-flex w-full"
                >
                  <div 
                    role="button"
                    tabindex="0"
                    on:click={handleSignIn}
                    on:keydown={(e) => e.key === "Enter" && handleSignIn()}
                    class="grow shrink basis-0 px-4 py-2 rounded-[10px] border border-light-border dark:border-dark-border flex-col justify-center items-center gap-2.5 inline-flex overflow-hidden transition-colors bg-light-bg-primary dark:bg-dark-bg-primary {isGoogleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
                  >
                    <div
                      class="justify-start items-center gap-2.5 inline-flex w-full"
                    >
                      {#if isGoogleLoading}
                        <div class="w-6 h-6 flex items-center justify-center">
                          <div class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-light-text-primary dark:border-dark-text-primary"></div>
                        </div>
                      {:else}
                        <div
                          class="w-6 h-6 relative overflow-hidden flex-shrink-0"
                        >
                          <img
                            src="/google-icon.svg"
                            alt="Google"
                            class="w-full h-full"
                          />
                        </div>
                      {/if}
                      <div
                        class="text-light-text-primary dark:text-dark-text-primary text-sm-button whitespace-nowrap"
                      >
                        Sign {isRegistering ? "up" : "in"} with Google
                      </div>
                    </div>
                  </div>
                  <div 
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === "Enter" && null}
                    class="grow shrink basis-0 px-4 py-2 rounded-[10px] border border-light-border dark:border-dark-border flex-col justify-center items-center gap-2.5 inline-flex overflow-hidden transition-colors bg-light-bg-primary dark:bg-dark-bg-primary"
                  >
                    <div
                      class="justify-center items-center gap-2.5 inline-flex w-full"
                    >
                      <div
                        class="w-6 h-6 relative overflow-hidden flex-shrink-0"
                      >
                        <svg
                          width="21"
                          height="24"
                          viewBox="0 0 21 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          class="text-light-text-primary dark:text-dark-text-primary"
                        >
                          <path
                            d="M14.2364 -0.000586885C12.8752 0.091288 11.4183 0.901288 10.5164 1.99441C9.72703 2.95629 9.06515 4.36816 9.3164 5.83441C9.0914 5.76504 8.88703 5.75754 8.6414 5.66941C7.97203 5.43129 7.20703 5.17441 6.2564 5.17441C4.36828 5.17441 2.43515 6.29754 1.2164 8.17441C-0.557345 10.9007 -0.201096 15.6988 2.4914 19.7994C2.96578 20.5194 3.5189 21.305 4.2014 21.9294C4.8839 22.5538 5.7089 23.03 6.6764 23.0394C7.50328 23.0488 8.0789 22.7732 8.5964 22.5444C9.1139 22.3157 9.59578 22.1132 10.5014 22.1094C10.507 22.1094 10.5108 22.1094 10.5164 22.1094C11.4183 22.1019 11.8852 22.3007 12.3914 22.5294C12.8977 22.7582 13.4677 23.0469 14.2964 23.0394C15.2827 23.0319 16.1208 22.4919 16.8164 21.8244C17.512 21.1569 18.0839 20.3375 18.5564 19.6194C19.2333 18.5882 19.5052 18.0257 20.0264 16.8744C20.0808 16.7544 20.0827 16.6157 20.0302 16.4938C19.9795 16.3719 19.8802 16.2763 19.7564 16.2294C18.0502 15.5844 17.077 14.075 16.9364 12.4794C16.7958 10.8838 17.4708 9.24129 19.1714 8.30941C19.297 8.24191 19.3852 8.12379 19.4152 7.98504C19.4433 7.84629 19.4095 7.70004 19.3214 7.58941C18.1008 6.07254 16.3833 5.17441 14.7014 5.17441C13.6289 5.17441 12.8414 5.42754 12.1964 5.66941C12.0895 5.71066 12.0108 5.70691 11.9114 5.74441C12.5658 5.39941 13.1433 4.92129 13.5764 4.36441C14.3639 3.35379 14.9714 1.91566 14.7464 0.404413C14.7089 0.156913 14.4858 -0.0193369 14.2364 -0.000586885ZM13.7264 1.13941C13.6945 2.10879 13.3627 3.05754 12.8114 3.76441C12.2339 4.50691 11.2627 5.02066 10.3214 5.17441C10.3383 4.24254 10.7058 3.27691 11.2664 2.59441C11.8552 1.88191 12.8302 1.36816 13.7264 1.13941ZM6.2564 6.13441C6.6764 6.13441 7.6514 6.33504 8.3114 6.56941C8.9714 6.80379 9.66703 7.07941 10.4864 7.07941C11.287 7.07941 11.9208 6.80191 12.5414 6.56941C13.162 6.33691 13.7808 6.13441 14.7014 6.13441C15.9033 6.13441 17.2027 6.75879 18.2264 7.84441C16.5877 9.00129 15.8208 10.805 15.9764 12.5544C16.132 14.3225 17.197 16.0007 18.9464 16.8744C18.9439 16.8799 18.9414 16.8853 18.9389 16.8907C18.5643 17.7066 18.3146 18.2507 17.7614 19.0944C17.302 19.7938 16.7564 20.5588 16.1564 21.1344C15.5564 21.71 14.9208 22.0738 14.2814 22.0794C13.6645 22.085 13.3139 21.9013 12.7814 21.6594C12.2489 21.4175 11.5608 21.14 10.5014 21.1494C9.4439 21.155 8.7464 21.4213 8.2064 21.6594C7.6664 21.8975 7.31203 22.085 6.6914 22.0794C6.03515 22.0738 5.42578 21.755 4.8464 21.2244C4.26703 20.6938 3.7439 19.97 3.2864 19.2744C0.766404 15.4344 0.563905 10.9232 2.0114 8.69941C3.07265 7.06629 5.8364 6.13441 6.2564 6.13441Z"
                            fill="currentColor"
                          />
                          <path
                            d="M6.2564 6.13441C6.6764 6.13441 7.6514 6.33504 8.3114 6.56941C8.9714 6.80379 9.66703 7.07941 10.4864 7.07941C11.287 7.07941 11.9208 6.80191 12.5414 6.56941C13.162 6.33691 13.7808 6.13441 14.7014 6.13441C15.9033 6.13441 17.2027 6.75879 18.2264 7.84441C16.5877 9.00129 15.8208 10.805 15.9764 12.5544C16.132 14.3225 17.197 16.0007 18.9464 16.8744C18.9439 16.8799 18.9414 16.8853 18.9389 16.8907C18.5643 17.7066 18.3146 18.2507 17.7614 19.0944C17.302 19.7938 16.7564 20.5588 16.1564 21.1344C15.5564 21.71 14.9208 22.0738 14.2814 22.0794C13.6645 22.085 13.3139 21.9013 12.7814 21.6594C12.2489 21.4175 11.5608 21.14 10.5014 21.1494C9.4439 21.155 8.7464 21.4213 8.2064 21.6594C7.6664 21.8975 7.31203 22.085 6.6914 22.0794C6.03515 22.0738 5.42578 21.755 4.8464 21.2244C4.26703 20.6938 3.7439 19.97 3.2864 19.2744C0.766404 15.4344 0.563905 10.9232 2.0114 8.69941C3.07265 7.06629 5.8364 6.13441 6.2564 6.13441Z"
                            fill="currentColor"
                          />
                          <path
                            d="M13.7264 1.13941C13.6945 2.10879 13.3627 3.05754 12.8114 3.76441C12.2339 4.50691 11.2627 5.02066 10.3214 5.17441C10.3383 4.24254 10.7058 3.27691 11.2664 2.59441C11.8552 1.88191 12.8302 1.36816 13.7264 1.13941Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <div
                        class="text-light-text-primary dark:text-dark-text-primary text-sm-button whitespace-nowrap"
                      >
                        Sign {isRegistering ? "up" : "in"} with Apple
                      </div>
                    </div>
                  </div>
                </div>
                <div class="self-stretch text-center">
                  <span
                    class="text-light-text-primary dark:text-dark-text-primary text-semi-body"
                    >Already have account?
                  </span>
                  <button
                    type="button"
                    on:click={() => switchMode("signin")}
                    class="text-brand-red text-semi-body underline leading-snug"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <!-- Login Form -->
          <div
            class="flex-col justify-start items-start gap-[50px] lg:gap-8 inline-flex w-full"
          >
            <div
              class="self-stretch h-[116px] lg:h-[84px] flex-col justify-start items-start gap-4 flex"
            >
              <!-- Back Button - Mobile Only -->
              <button 
                on:click={() => window.history.back()} 
                class="lg:hidden w-6 h-6 mb-2"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  class="text-light-text-primary dark:text-dark-text-primary"
                >
                  <path
                    d="M4 12H20"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M8.99997 17C8.99997 17 4.00002 13.3176 4 12C3.99999 10.6824 9 7 9 7"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <div
                class="self-stretch text-light-text-primary dark:text-dark-text-primary text-h2"
              >
                Login
              </div>
              <div
                class="self-stretch text-light-text-tertiary dark:text-dark-text-tertiary text-body"
              >
                Welcome back!
              </div>
            </div>

            <!-- Add Error and Success Messages -->
            {#if error}
              <div
                class="self-stretch p-4 bg-red-100 text-red-700 rounded-lg text-semi-body"
              >
                {error}
              </div>
            {/if}
            {#if successMessage}
              <div
                class="self-stretch p-4 bg-green-100 text-green-700 rounded-lg text-semi-body"
              >
                {successMessage}
              </div>
            {/if}

            <div
              class="self-stretch flex-col justify-start items-start gap-8 flex"
            >
              <form
                on:submit|preventDefault={handleEmailAuth}
                class="self-stretch flex-col justify-start items-center gap-8 flex"
              >
                <div
                  class="self-stretch flex-col justify-start items-start gap-5 flex"
                >
                  <!-- Email Field -->
                  <div
                    class="self-stretch flex-col justify-start items-start gap-1 flex"
                  >
                    <div class="justify-start items-start gap-2.5 inline-flex">
                      <div
                        class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium"
                      >
                        Email address
                      </div>
                    </div>
                    <input
                      type="email"
                      bind:value={email}
                      placeholder="Enter email address"
                      class="self-stretch form-input"
                    />
                  </div>

                  <!-- Password Field -->
                  <div
                    class="self-stretch flex-col justify-start items-start gap-1 flex"
                  >
                    <div class="justify-start items-start gap-2.5 inline-flex">
                      <div
                        class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium"
                      >
                        Password
                      </div>
                    </div>
                    <div
                      class="self-stretch flex-col justify-start items-start gap-4 flex"
                    >
                      <div class="password-input-container">
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
                            src={showPassword
                              ? "/icons/view-off-slash.svg"
                              : "/icons/view.svg"}
                            alt={showPassword
                              ? "Hide password"
                              : "Show password"}
                            class="w-6 h-6"
                          />
                        </button>
                      </div>
                      <button
                        type="button"
                        on:click={() => switchMode("reset")}
                        class="px-6 text-brand-red text-semi-body underline leading-snug"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Main sign up/sign in buttons -->
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  textClass="text-body"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isRegistering ? "Sign up" : "Sign in"}
                </Button>
              </form>

              <!-- Social Login -->
              <div
                class="self-stretch flex-col justify-start items-center gap-8 flex"
              >
                <div
                  class="h-10 justify-center items-center gap-4 inline-flex w-full"
                >
                  <div 
                    role="button"
                    tabindex="0"
                    on:click={handleSignIn}
                    on:keydown={(e) => e.key === "Enter" && handleSignIn()}
                    class="grow shrink basis-0 px-4 py-2 rounded-[10px] border border-light-border dark:border-dark-border flex-col justify-center items-center gap-2.5 inline-flex overflow-hidden transition-colors bg-light-bg-primary dark:bg-dark-bg-primary {isGoogleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
                  >
                    <div
                      class="justify-start items-center gap-2.5 inline-flex w-full"
                    >
                      {#if isGoogleLoading}
                        <div class="w-6 h-6 flex items-center justify-center">
                          <div class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-light-text-primary dark:border-dark-text-primary"></div>
                        </div>
                      {:else}
                        <div
                          class="w-6 h-6 relative overflow-hidden flex-shrink-0"
                        >
                          <img
                            src="/google-icon.svg"
                            alt="Google"
                            class="w-full h-full"
                          />
                        </div>
                      {/if}
                      <div
                        class="text-light-text-primary dark:text-dark-text-primary text-sm-button whitespace-nowrap"
                      >
                        Sign {isRegistering ? "up" : "in"} with Google
                      </div>
                    </div>
                  </div>
                  <div 
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === "Enter" && null}
                    class="grow shrink basis-0 px-4 py-2 rounded-[10px] border border-light-border dark:border-dark-border flex-col justify-center items-center gap-2.5 inline-flex overflow-hidden transition-colors bg-light-bg-primary dark:bg-dark-bg-primary"
                  >
                    <div
                      class="justify-center items-center gap-2.5 inline-flex w-full"
                    >
                      <div
                        class="w-6 h-6 relative overflow-hidden flex-shrink-0"
                      >
                        <svg
                          width="21"
                          height="24"
                          viewBox="0 0 21 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          class="text-light-text-primary dark:text-dark-text-primary"
                        >
                          <path
                            d="M14.2364 -0.000586885C12.8752 0.091288 11.4183 0.901288 10.5164 1.99441C9.72703 2.95629 9.06515 4.36816 9.3164 5.83441C9.0914 5.76504 8.88703 5.75754 8.6414 5.66941C7.97203 5.43129 7.20703 5.17441 6.2564 5.17441C4.36828 5.17441 2.43515 6.29754 1.2164 8.17441C-0.557345 10.9007 -0.201096 15.6988 2.4914 19.7994C2.96578 20.5194 3.5189 21.305 4.2014 21.9294C4.8839 22.5538 5.7089 23.03 6.6764 23.0394C7.50328 23.0488 8.0789 22.7732 8.5964 22.5444C9.1139 22.3157 9.59578 22.1132 10.5014 22.1094C10.507 22.1094 10.5108 22.1094 10.5164 22.1094C11.4183 22.1019 11.8852 22.3007 12.3914 22.5294C12.8977 22.7582 13.4677 23.0469 14.2964 23.0394C15.2827 23.0319 16.1208 22.4919 16.8164 21.8244C17.512 21.1569 18.0839 20.3375 18.5564 19.6194C19.2333 18.5882 19.5052 18.0257 20.0264 16.8744C20.0808 16.7544 20.0827 16.6157 20.0302 16.4938C19.9795 16.3719 19.8802 16.2763 19.7564 16.2294C18.0502 15.5844 17.077 14.075 16.9364 12.4794C16.7958 10.8838 17.4708 9.24129 19.1714 8.30941C19.297 8.24191 19.3852 8.12379 19.4152 7.98504C19.4433 7.84629 19.4095 7.70004 19.3214 7.58941C18.1008 6.07254 16.3833 5.17441 14.7014 5.17441C13.6289 5.17441 12.8414 5.42754 12.1964 5.66941C12.0895 5.71066 12.0108 5.70691 11.9114 5.74441C12.5658 5.39941 13.1433 4.92129 13.5764 4.36441C14.3639 3.35379 14.9714 1.91566 14.7464 0.404413C14.7089 0.156913 14.4858 -0.0193369 14.2364 -0.000586885ZM13.7264 1.13941C13.6945 2.10879 13.3627 3.05754 12.8114 3.76441C12.2339 4.50691 11.2627 5.02066 10.3214 5.17441C10.3383 4.24254 10.7058 3.27691 11.2664 2.59441C11.8552 1.88191 12.8302 1.36816 13.7264 1.13941ZM6.2564 6.13441C6.6764 6.13441 7.6514 6.33504 8.3114 6.56941C8.9714 6.80379 9.66703 7.07941 10.4864 7.07941C11.287 7.07941 11.9208 6.80191 12.5414 6.56941C13.162 6.33691 13.7808 6.13441 14.7014 6.13441C15.9033 6.13441 17.2027 6.75879 18.2264 7.84441C16.5877 9.00129 15.8208 10.805 15.9764 12.5544C16.132 14.3225 17.197 16.0007 18.9464 16.8744C18.9439 16.8799 18.9414 16.8853 18.9389 16.8907C18.5643 17.7066 18.3146 18.2507 17.7614 19.0944C17.302 19.7938 16.7564 20.5588 16.1564 21.1344C15.5564 21.71 14.9208 22.0738 14.2814 22.0794C13.6645 22.085 13.3139 21.9013 12.7814 21.6594C12.2489 21.4175 11.5608 21.14 10.5014 21.1494C9.4439 21.155 8.7464 21.4213 8.2064 21.6594C7.6664 21.8975 7.31203 22.085 6.6914 22.0794C6.03515 22.0738 5.42578 21.755 4.8464 21.2244C4.26703 20.6938 3.7439 19.97 3.2864 19.2744C0.766404 15.4344 0.563905 10.9232 2.0114 8.69941C3.07265 7.06629 5.8364 6.13441 6.2564 6.13441Z"
                            fill="currentColor"
                          />
                          <path
                            d="M6.2564 6.13441C6.6764 6.13441 7.6514 6.33504 8.3114 6.56941C8.9714 6.80379 9.66703 7.07941 10.4864 7.07941C11.287 7.07941 11.9208 6.80191 12.5414 6.56941C13.162 6.33691 13.7808 6.13441 14.7014 6.13441C15.9033 6.13441 17.2027 6.75879 18.2264 7.84441C16.5877 9.00129 15.8208 10.805 15.9764 12.5544C16.132 14.3225 17.197 16.0007 18.9464 16.8744C18.9439 16.8799 18.9414 16.8853 18.9389 16.8907C18.5643 17.7066 18.3146 18.2507 17.7614 19.0944C17.302 19.7938 16.7564 20.5588 16.1564 21.1344C15.5564 21.71 14.9208 22.0738 14.2814 22.0794C13.6645 22.085 13.3139 21.9013 12.7814 21.6594C12.2489 21.4175 11.5608 21.14 10.5014 21.1494C9.4439 21.155 8.7464 21.4213 8.2064 21.6594C7.6664 21.8975 7.31203 22.085 6.6914 22.0794C6.03515 22.0738 5.42578 21.755 4.8464 21.2244C4.26703 20.6938 3.7439 19.97 3.2864 19.2744C0.766404 15.4344 0.563905 10.9232 2.0114 8.69941C3.07265 7.06629 5.8364 6.13441 6.2564 6.13441Z"
                            fill="currentColor"
                          />
                          <path
                            d="M13.7264 1.13941C13.6945 2.10879 13.3627 3.05754 12.8114 3.76441C12.2339 4.50691 11.2627 5.02066 10.3214 5.17441C10.3383 4.24254 10.7058 3.27691 11.2664 2.59441C11.8552 1.88191 12.8302 1.36816 13.7264 1.13941Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <div
                        class="text-light-text-primary dark:text-dark-text-primary text-sm-button whitespace-nowrap"
                      >
                        Sign {isRegistering ? "up" : "in"} with Apple
                      </div>
                    </div>
                  </div>
                </div>
                <div class="self-stretch text-center">
                  <span
                    class="text-light-text-primary dark:text-dark-text-primary text-semi-body"
                    >Don't have an account?
                  </span>
                  <button
                    type="button"
                    on:click={() => switchMode("register")}
                    class="text-brand-red text-semi-body underline leading-snug"
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
    <div
      class="hidden lg:flex w-[48%] fixed right-0 top-0 bottom-0 flex-col justify-center items-center p-8 lg:p-0 bg-black/5 dark:bg-white/10 rounded-[64px_0_0_64px]"
    >
      <OnboardingCarousel />
    </div>
  </div>
</div>

<style>
  .form-input {
    @apply w-full px-6 py-4 rounded-[16px] border-none focus:outline-none text-light-text-primary dark:text-dark-text-primary text-base bg-white dark:bg-dark-bg-primary transition-all duration-200;
    box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.05);
  }
  /*  focus state */
  .form-input:focus {
    @apply ring-2 ring-brand-red text-light-text-secondary dark:text-dark-text-secondary;
  }

  .form-input:focus::placeholder {
    @apply text-light-text-secondary dark:text-dark-text-secondary pl-2;
  }

  .form-label {
    @apply block text-base font-medium text-light-text-primary dark:text-dark-text-primary mb-2;
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
    background-image: url("/icons/checkmark-square-inactive.svg");
  }

  .custom-checkbox:checked + label::before {
    background-image: url("/icons/checkmark-square-active.svg");
  }

  /* Add styles for the password input container */
  .password-input-container {
    @apply self-stretch form-input flex justify-between items-center transition-all duration-200 bg-white dark:bg-dark-bg-primary;
  }

  .password-input-container:focus-within {
    @apply ring-2 ring-brand-red;
  }

  .password-input-container input {
    @apply text-light-text-primary dark:text-dark-text-primary bg-transparent;
  }

  .password-input-container input:focus {
    @apply text-light-text-primary dark:text-dark-text-primary;
  }

  .password-input-container input:focus::placeholder {
    @apply text-light-text-secondary dark:text-dark-text-secondary;
  }
</style>
