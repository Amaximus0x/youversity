<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { isAuthenticated } from "$lib/stores/auth";
  import LandingHeader from "$lib/components/LandingHeader.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { theme } from "$lib/stores/theme";

  let showShareModal = false;
  let selectedCourseId = "";
  let isMobile = false;
  let showLoadingOverlay = false;
  let showCreationOverlay = false;

  // Redirect authenticated users to dashboard
  onMount(() => {
    if ($isAuthenticated) {
      goto("/dashboard");
    }
    if (window.innerWidth < 768) {
      isMobile = true;
    }
    
    // Show thumbnail for 3 seconds, then transition to video
    setTimeout(() => {
      const thumbnailContainer = document.getElementById('thumbnailContainer');
      const videoContainer = document.getElementById('videoContainer');
      const videoNotch = document.getElementById('videoNotch');

      if (videoContainer && thumbnailContainer && videoNotch) {
        // First fade out the thumbnail
        thumbnailContainer.style.opacity = '0';
        thumbnailContainer.style.transition = 'opacity 0.5s ease';
        
        // After the fade out completes, hide thumbnail and show video
        setTimeout(() => {
          thumbnailContainer.style.display = 'none';
          videoContainer.style.display = 'block';
          videoNotch.style.display = 'block';
          // Optional: fade in the video
          videoContainer.style.opacity = '0';
          videoNotch.style.opacity = '0';
          videoContainer.style.transition = 'opacity 0.5s ease';
          videoNotch.style.transition = 'opacity 0.5s ease';
          requestAnimationFrame(() => {
            videoContainer.style.opacity = '1';
            videoNotch.style.opacity = '1';
          });
        }, 500); // Wait for fade out to complete
      }
    }, 3000); // 3 seconds delay
  });

  function navigateToLogin() {
    goto("/login");
  }
</script>

<div class="min-h-screen flex flex-col bg-gradient-light dark:bg-gradient-dark">
  <!-- Landing Header -->
  <LandingHeader />
  <div class="flex flex-col gap-16 md:gap-[120px] mb-64 w-full overflow-hidden">
    <div>
      <!-- Hero Section -->
      <section class="flex-1 flex flex-col items-center justify-center px-4 pt-8 md:pt-20 relative w-full">
        <div class="max-w-5xl mx-auto text-center flex flex-col items-center justify-center gap-14 relative w-full">
          <!-- Action buttons for medium to large screens -->
          <div class="hidden md:block absolute -left-[4rem] top-[11rem]">
            <div
              class="bg-[#4CD964] text-white px-2 py-1 rounded-[4px] flex items-center gap-2 shadow-md relative"
            >
              <span class="text-sm font-medium">Create Course</span>
            
              <div
                class="absolute -right-3 -top-[10%] -translate-y-1/2 transform rotate-90"
              >
              <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="8665632_location_arrow_icon 1" clip-path="url(#clip0_3571_46428)">
                <path id="Vector" d="M0.126552 3.45273L5.15741 15.7961C5.45272 16.4707 6.07499 16.875 6.74999 16.875C7.7639 16.875 8.43819 16.0629 8.43819 15.2192V9.62581H14.0625C14.869 9.62581 15.5626 9.05558 15.718 8.26351C15.874 7.47249 15.4477 6.71312 14.7013 6.37597L2.35792 1.34511C1.73003 1.08696 1.00616 1.23303 0.525927 1.71425C0.0140514 2.10027 -0.133604 2.82308 0.126552 3.45273Z" 
                fill="#4CD964"/>
                </g>
                <defs>
                <clipPath id="clip0_3571_46428">
                <rect width="15.75" height="18" fill="white" transform="matrix(-1 0 0 1 15.75 0)"/>
                </clipPath>
                </defs>
                </svg>
              </div>
            </div>
          </div>

          <div
            class="hidden md:block absolute -right-[4rem] top-[11rem]"
          >
            <div
              class="bg-[#4C6DD9] text-white px-2 py-1 rounded-[4px] flex items-center gap-2 shadow-md relative"
            >
              <span class="text-sm font-medium">Take Quiz</span>
              
              <div
                class="absolute -left-3 -top-[10%] -translate-y-1/2 transform -rotate-135"
              >
              <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="8665632_location_arrow_icon 1" clip-path="url(#clip0_3571_46428)">
                <path id="Vector" d="M0.126552 3.45273L5.15741 15.7961C5.45272 16.4707 6.07499 16.875 6.74999 16.875C7.7639 16.875 8.43819 16.0629 8.43819 15.2192V9.62581H14.0625C14.869 9.62581 15.5626 9.05558 15.718 8.26351C15.874 7.47249 15.4477 6.71312 14.7013 6.37597L2.35792 1.34511C1.73003 1.08696 1.00616 1.23303 0.525927 1.71425C0.0140514 2.10027 -0.133604 2.82308 0.126552 3.45273Z" 
                fill="#4C6DD9"/>
                </g>
                <defs>
                <clipPath id="clip0_3571_46428">
                <rect width="15.75" height="18" fill="white" transform="matrix(-1 0 0 1 15.75 0)"/>
                </clipPath>
                </defs>
                </svg>
              </div>
            </div>
          </div>

          <div
            class="hidden md:block absolute left-[4rem] bottom-[7rem]"
          >
            <div
              class="bg-[#804CD9] text-white px-2 py-1 rounded-[4px] flex items-center gap-2 shadow-md relative"
            >
              <span class="text-sm font-medium">Upvotes</span>
            
              <div
                class="absolute -right-3 -top-[10%] -translate-y-1/2 transform rotate-90"
              >
              <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="8665632_location_arrow_icon 1" clip-path="url(#clip0_3571_46428)">
                <path id="Vector" d="M0.126552 3.45273L5.15741 15.7961C5.45272 16.4707 6.07499 16.875 6.74999 16.875C7.7639 16.875 8.43819 16.0629 8.43819 15.2192V9.62581H14.0625C14.869 9.62581 15.5626 9.05558 15.718 8.26351C15.874 7.47249 15.4477 6.71312 14.7013 6.37597L2.35792 1.34511C1.73003 1.08696 1.00616 1.23303 0.525927 1.71425C0.0140514 2.10027 -0.133604 2.82308 0.126552 3.45273Z" 
                fill="#804CD9"/>
                </g>
                <defs>
                <clipPath id="clip0_3571_46428">
                <rect width="15.75" height="18" fill="white" transform="matrix(-1 0 0 1 15.75 0)"/>
                </clipPath>
                </defs>
                </svg>
              </div>
            </div>
          </div>

          <div
            class="hidden md:block absolute right-[4rem] bottom-24"
          >
            <div
              class="bg-[#FFA600] text-white px-2 py-1 rounded-[4px] flex items-center gap-2 shadow-md relative"
            >
              <span class="text-sm font-medium">Trending Course</span>
              
              <div
                class="absolute -left-3 -top-[10%] -translate-y-1/2 transform -rotate-135"
              >
              <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="8665632_location_arrow_icon 1" clip-path="url(#clip0_3571_46428)">
                <path id="Vector" d="M0.126552 3.45273L5.15741 15.7961C5.45272 16.4707 6.07499 16.875 6.74999 16.875C7.7639 16.875 8.43819 16.0629 8.43819 15.2192V9.62581H14.0625C14.869 9.62581 15.5626 9.05558 15.718 8.26351C15.874 7.47249 15.4477 6.71312 14.7013 6.37597L2.35792 1.34511C1.73003 1.08696 1.00616 1.23303 0.525927 1.71425C0.0140514 2.10027 -0.133604 2.82308 0.126552 3.45273Z"
                 fill="#FFA600"/>
                </g>
                <defs>
                <clipPath id="clip0_3571_46428">
                <rect width="15.75" height="18" fill="white" transform="matrix(-1 0 0 1 15.75 0)"/>
                </clipPath>
                </defs>
                </svg>
              </div>
            </div>
          </div>

          <div
            class="w-full flex flex-col justify-center items-center gap-8"
          >
            <div
              class="self-stretch relative text-center justify-center text-h1-landing-mobile md:text-h1-landing"
            >
              <span class="text-[#42c1c9]">Transform </span><span
                class="text-white"
              >
              </span><span
                class="text-light-text-secondary dark:text-dark-text-secondary"
                >Your</span
              ><span class="text-white"> <br /></span><span
                class="text-[#ee3d4e]"
                >YouTube
              </span><span class="text-white"> </span><span
                class="text-light-text-secondary dark:text-dark-text-secondary"
                >Time<br />Into Real
              </span><span class="text-white"> </span><span
                class="text-[#42c1c9]">Learning</span
              >
            </div>

            <div
              class="max-w-[529px]  relative text-center justify-center text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body md:text-body leading-snug"
            >
              Turn those "just 5 more minutes" of YouTube into actual knowledge
              that matters. YouVersity transforms your watching habits into
              structured learning adventures.
            </div>
          </div>

          <div class="flex justify-center">
            <button
              on:click={navigateToLogin}
              class=" px-10 md:px-8 py-4 bg-brand-red text-white rounded-lg transition-all text-body-semibold font-medium"
            >
              <div class="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 7L9.48415 8.39405C8.80774 10.222 8.46953 11.136 7.80278 11.8028C7.13603 12.4695 6.22204 12.8077 4.39405 13.4842L3 14L4.39405 14.5158C6.22204 15.1923 7.13603 15.5305 7.80278 16.1972C8.46953 16.864 8.80774 17.778 9.48415 19.6059L10 21L10.5158 19.6059C11.1923 17.778 11.5305 16.864 12.1972 16.1972C12.864 15.5305 13.778 15.1923 15.6059 14.5158L17 14L15.6059 13.4842C13.778 12.8077 12.864 12.4695 12.1972 11.8028C11.5305 11.136 11.1923 10.222 10.5158 8.39405L10 7Z"
                    stroke="#ffff"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M18 3L17.7789 3.59745C17.489 4.38087 17.3441 4.77259 17.0583 5.05833C16.7726 5.34408 16.3809 5.48903 15.5975 5.77892L15 6L15.5975 6.22108C16.3809 6.51097 16.7726 6.65592 17.0583 6.94167C17.3441 7.22741 17.489 7.61913 17.7789 8.40255L18 9L18.2211 8.40255C18.511 7.61913 18.6559 7.22741 18.9417 6.94166C19.2274 6.65592 19.6191 6.51097 20.4025 6.22108L21 6L20.4025 5.77892C19.6191 5.48903 19.2274 5.34408 18.9417 5.05833C18.6559 4.77259 18.511 4.38087 18.2211 3.59745L18 3Z"
                    stroke="#ffff"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Create Course</span>
              </div>
            </button>

            <!-- <button
              on:click={() => {}}
              class="px-10 md:px-8 py-4 text-brand-turquoise rounded-lg bg-brand-turquoise/10 transition-all text-body-semibold font-medium"
            >
              <div class="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="play-circle-02">
                    <path
                      id="Vector"
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#41C1CB"
                      stroke-width="1.5"
                    />
                    <path
                      id="Vector_2"
                      d="M9.5 11.1998V12.8002C9.5 14.3195 9.5 15.0791 9.95576 15.3862C10.4115 15.6932 11.0348 15.3535 12.2815 14.6741L13.7497 13.8738C15.2499 13.0562 16 12.6474 16 12C16 11.3526 15.2499 10.9438 13.7497 10.1262L12.2815 9.32594C11.0348 8.6465 10.4115 8.30678 9.95576 8.61382C9.5 8.92086 9.5 9.6805 9.5 11.1998Z"
                      stroke="#41C1CB"
                      stroke-width="1.5"
                    />
                  </g>
                </svg>
                <span>Watch Demo</span>
              </div>
            </button> -->
          </div>
        </div>
      </section>



       <!-- Content image Section -->
       <section class="pt-10 mb-28 px-4 md:px-8 lg:px-24 relative overflow-hidden w-full" id="thumbnailContainer" style="display: block;">
        <div class="relative">
            <img
              src={$theme === "light" ? "/images/landing/home-light.png" : "/images/landing/home-dark.png"}
              alt="Youversity platform interface - light mode"
              class="w-full h-auto"
            />
        </div>
        <div
          class="absolute inset-0 w-full h-full mt-[20px] lg:mt-[142px] bg-content-gradient-light dark:bg-content-gradient-dark pointer-events-none z-10"
        ></div>
      </section>

      <section class="py-20 px-4 md:px-8 lg:px-24 relative overflow-hidden w-full" id="videoContainer" style="display: none;">
        <!-- Demo Video Section -->
        <div class="video-wrapper relative w-full max-w-[1200px] mx-auto">
          <div class="notch" id="videoNotch" style="display: none;"></div>
          <div class="relative w-full rounded-2xl overflow-hidden border-[19px] border-[#303030] shadow-[0px_0px_68px_0px_#00000052]" >
            <!-- YouTube Embed with more parameters -->
            <div class="aspect-video w-full">
              <iframe
                class="w-full h-full pointer-events-none"
                src="https://www.youtube.com/embed/LdWqyrSIb4s?autoplay=1&mute=1&loop=1&playlist=LdWqyrSIb4s&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=localhost:3000&start=1&disablekb=1&fs=0&color=white&version=3&playlist=LdWqyrSIb4s"
                title="YouVersity Demo Video"
                loading="lazy"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
              </iframe>
            </div>
          </div>
        </div>
      </section>

          <!-- Features Section -->
    <div class="w-full ">
      <!-- Features Section 1-->
      <section class="px-4 md:px-8 lg:px-24 w-full">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-h2-landing-mobile md:text-h2-landing text-light-text-primary dark:text-dark-text-primary text-center mb-6 lg:mb-16">
            How it Works
          </h2>

          <!-- Feature 1 -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24 items-center">
            <div class="w-full h-auto order-2 lg:order-1">
              <img
                src={$theme === "light" ? "/images/landing/how-it-works-light.png" : "/images/landing/how-it-works-dark.png"}
                alt="Course creation process illustration"
                class="w-full h-auto"
              />
            </div>

            <div class="flex flex-col justify-start items-start gap-6 order-1 lg:order-2">
              <div class="text-brand-red text-base font-semibold">
                CREATE YOUR COURSE
              </div>
              <div class="flex flex-col justify-start items-start gap-4">
                <h3 class="text-2xl lg:text-4xl font-bold text-light-text-secondary dark:text-dark-text-secondary leading-tight">
                  Start Learning Simply enter what you Want to Learn
                </h3>
                <p class="text-light-text-tertiary dark:text-dark-text-tertiary text-sm lg:text-base">
                  Learning something new is easier than ever. Just enter a topic, and we'll provide personalized resources to guide you every step of the way.
                </p>
              </div>
              <div class="flex flex-col gap-4 w-full">
                <div class="p-4 bg-black/5 dark:bg-white/10 rounded-lg flex items-start gap-2.5">
                  <div class="w-6 h-6 flex-shrink-0">
                    <img src="/images/landing/idea.svg" alt="Identify What You Want to Learn" class="w-full h-full" />
                  </div>
                  <div>
                    <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Identify What You Want to Learn: </span>
                    <span class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body">Decide on the skill, subject, or topic you want to explore.</span>
                  </div>
                </div>
                <div class="p-4 bg-black/5 dark:bg-white/10 rounded-lg flex items-start gap-2.5">
                  <div class="w-6 h-6 flex-shrink-0">
                    <img src="/images/landing/keyboard.svg" alt="Input Prompt" class="w-full h-full" />
                  </div>
                  <div>
                    <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Input Prompt: </span>
                    <span class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body">Enter a clear and specific prompt describing your learning objective.</span>
                  </div>
                </div>
                <div class="p-4 bg-black/5 dark:bg-white/10 rounded-lg flex items-start gap-2.5">
                  <div class="w-6 h-6 flex-shrink-0">
                    <img src="/icons/arrow-right.svg" alt="Click Create Course" class="w-full h-full" />
                  </div>
                  <div>
                    <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Click on Create Course: </span>
                    <span class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body">Select "Create Course" to instantly generate a structured course with lessons and resources.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section 2-->
      <section class="pt-16 px-4 md:px-8 lg:px-24 w-full">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24 items-center">
            <div class="flex flex-col justify-start items-start gap-6">
              <div class="text-brand-red text-base font-semibold">
                WATCH IT TRANSFORM
              </div>
              <div class="flex flex-col justify-start items-start gap-4">
                <h3 class="text-2xl lg:text-4xl font-bold text-light-text-secondary dark:text-dark-text-secondary leading-tight">
                  AI-Powered Learning, Structured for You
                </h3>
                <p class="text-light-text-tertiary dark:text-dark-text-tertiary text-sm lg:text-base">
                  Our AI curates top YouTube content on your topic, structuring it into a step-by-step course for seamless learning.
                </p>
              </div>
              <div class="flex flex-col gap-4 w-full">
                <div class="p-4 bg-black/5 dark:bg-white/10 rounded-lg flex items-start gap-2.5">
                  <div class="w-6 h-6 flex-shrink-0">
                    <img src="/images/landing/ai-content-generator-01.svg" alt="Curated Content" class="w-full h-full" />
                  </div>
                  <div>
                    <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Curated Content: </span>
                    <span class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body">AI selects high-quality videos tailored to your topic for the best learning experience.</span>
                  </div>
                </div>
                <div class="p-4 bg-black/5 dark:bg-white/10 rounded-lg flex items-start gap-2.5">
                  <div class="w-6 h-6 flex-shrink-0">
                    <img src="/images/landing/arrange.svg" alt="Smart Organization" class="w-full h-full" />
                  </div>
                  <div>
                    <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Smart Organization: </span>
                    <span class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body">Your course follows a logical sequence, guiding you from basics to advanced concepts.</span>
                  </div>
                </div>
                <div class="p-4 bg-black/5 dark:bg-white/10 rounded-lg flex items-start gap-2.5">
                  <div class="w-6 h-6 flex-shrink-0">
                    <img src="/images/landing/online-learning-01.svg" alt="Instant Learning" class="w-full h-full" />
                  </div>
                  <div>
                    <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Instant Learning: </span>
                    <span class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body">Get your structured course in seconds and start learning immediately.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="w-full h-auto">
              <img
                src={$theme === "light" ? "/images/landing/how-it-works-light-2.png" : "/images/landing/how-it-works-dark-2.png"}
                alt="Course creation process illustration"
                class="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section 3-->
      <section class="pt-16 px-4 md:px-8 lg:px-24 w-full">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24 items-center">
            <div class="w-full h-auto order-2 lg:order-1">
              <img
                src={$theme === "light" ? "/images/landing/how-it-works-light-3.png" : "/images/landing/how-it-works-dark-3.png"}
                alt="Course creation process illustration"
                class="w-full h-auto"
              />
            </div>

            <div class="flex flex-col justify-start items-start gap-6 order-1 lg:order-2">
              <div class="text-brand-red text-base font-semibold">
                LEARN YOUR WAY
              </div>
              <div class="flex flex-col justify-start items-start gap-4">
                <h3 class="text-2xl lg:text-4xl font-bold text-light-text-secondary dark:text-dark-text-secondary leading-tight">
                  Personalized Learning at Your Own Pace
                </h3>
                <p class="text-light-text-tertiary dark:text-dark-text-tertiary text-sm lg:text-base">
                  Take charge of your learning. Move at your pace, track progress, and reinforce knowledge with auto-generated quizzes.
                </p>
              </div>
              <div class="flex flex-col gap-4 w-full">
                <div class="p-4 bg-black/5 dark:bg-white/10 rounded-lg flex items-start gap-2.5">
                  <div class="w-6 h-6 flex-shrink-0">
                    <img src="/images/landing/rocket-01.svg" alt="Self-Paced Learning" class="w-full h-full" />
                  </div>
                  <div>
                    <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Self-Paced Learning: </span>
                    <span class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body">Move through lessons at a comfortable pace, allowing for a flexible and stress-free experience.</span>
                  </div>
                </div>
                <div class="p-4 bg-black/5 dark:bg-white/10 rounded-lg flex items-start gap-2.5">
                  <div class="w-6 h-6 flex-shrink-0">
                    <img src="/images/landing/progress-04.svg" alt="Progress Tracking" class="w-full h-full" />
                  </div>
                  <div>
                    <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Progress Tracking: </span>
                    <span class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body">Monitor your learning milestones and stay motivated with real-time progress updates.</span>
                  </div>
                </div>
                <div class="p-4 bg-black/5 dark:bg-white/10 rounded-lg flex items-start gap-2.5">
                  <div class="w-6 h-6 flex-shrink-0">
                    <img src="/images/landing/knowledge-02.svg" alt="Knowledge Reinforcement" class="w-full h-full" />
                  </div>
                  <div>
                    <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Knowledge Reinforcement: </span>
                    <span class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body">Test your knowledge with AI-generated quizzes for better retention and mastery.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </div>



    <!-- Learning Section -->
    <section class="px-4 md:px-8 space-y-6 lg:space-y-16 w-full">
      <div class="self-stretch flex flex-col justify-center items-center gap-4">
        <h2
          class="text-h2-landing-mobile md:text-h2-landing text-light-text-primary dark:text-dark-text-primary text-center"
        >
          Learning for Everyone, Anywhere
        </h2>
        <div
          class="max-w-[849px] text-center text-[#797979] text-sm font-normal font-['Poppins'] leading-snug"
        >
          Knowledge should have no barriers. Our platform is designed to be
          accessible to anyone, anywhere—whether you're a student, professional,
          or lifelong learner. If you're eager to learn, we're here for you.
        </div>
      </div>
      {#if $theme === "light"}
        <div class="flex justify-center items-center">
          <img
            src="/images/landing/learning-light.svg"
            alt="Learning"
            class={isMobile
              ? "min-w-[390px] h-[193px]"
              : "min-w-[942px] h-[466px]"}
          />
        </div>
      {:else}
        <div class="flex justify-center items-center">
          <img
            src="/images/landing/learning-dark.svg"
            alt="Learning"
            class="min-w-[390px] min-h-[193px] max-w-[942px] max-h-[466px]"
          />
        </div>
      {/if}
    </section>

    <!-- Testimonials Section -->
    <section class="px-4 md:px-8 lg:px-24 w-full">
      <div class="text-center mb-12">
        <h2
          class="text-h2-landing-mobile md:text-h2-landing text-light-text-secondary dark:text-dark-text-secondary"
        >
          What our Early Users Say
        </h2>
      </div>

      <div
        class="flex flex-col md:flex-row md:flex-wrap md:justify-around md:gap-8"
      >
        <!-- First testimonial -->
        <div
          class="mb-6 md:mb-0 md:w-[454px] inline-flex justify-start items-start gap-4"
        >
          <img
            class="w-11 h-11 relative rounded-full"
            src="/images/landing/profile-picture.png"
            alt="Chantal John"
          />
          <div
            class="flex-1 md:w-[390px] inline-flex flex-col justify-start items-start gap-4"
          >
            <div class="flex flex-col justify-start items-start gap-2">
              <div
                class="w-[143px] relative justify-center text-light-text-primary dark:text-white text-xl font-semibold font-['Poppins'] leading-7"
              >
                Chantal John
              </div>
              <div
                class="self-stretch relative justify-center text-light-text-tertiary dark:text-[#a2a2a2] text-sm font-medium font-['Poppins']"
              >
                Kia Student
              </div>
            </div>
            <div
              class="self-stretch relative justify-center text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium font-['Poppins']"
            >
              It is a long established fact that a reader will be distracted by
              the readable content of a page when looking at its layout. The
              point of using Lorem Ipsum is that it has a more-or-less normal
              distribution of letters, as opposed to using
            </div>
          </div>
        </div>

        <!-- Second testimonial (centered in desktop) -->
        <div
          class="mb-6 md:mb-0 md:w-[454px] md:mt-16 inline-flex justify-start items-start gap-4"
        >
          <img
            class="w-11 h-11 relative rounded-full"
            src="/images/landing/profile-picture.png"
            alt="Chantal John"
          />
          <div
            class="flex-1 md:w-[390px] inline-flex flex-col justify-start items-start gap-4"
          >
            <div class="flex flex-col justify-start items-start gap-2">
              <div
                class="w-[143px] relative justify-center text-light-text-primary dark:text-white text-xl font-semibold font-['Poppins'] leading-7"
              >
                Chantal John
              </div>
              <div
                class="self-stretch relative justify-center text-light-text-tertiary dark:text-[#a2a2a2] text-sm font-medium font-['Poppins']"
              >
                Kia Student
              </div>
            </div>
            <div
              class="self-stretch relative justify-center text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium font-['Poppins']"
            >
              It is a long established fact that a reader will be distracted by
              the readable content of a page when looking at its layout. The
              point of using Lorem Ipsum is that it has a more-or-less normal
              distribution of letters, as opposed to using
            </div>
          </div>
        </div>

        <!-- Third testimonial -->
        <div class="md:w-[454px] inline-flex justify-start items-start gap-4">
          <img
            class="w-11 h-11 relative rounded-full"
            src="/images/landing/profile-picture.png"
            alt="Chantal John"
          />
          <div
            class="flex-1 md:w-[390px] inline-flex flex-col justify-start items-start gap-4"
          >
            <div class="flex flex-col justify-start items-start gap-2">
              <div
                class="w-[143px] relative justify-center text-light-text-primary dark:text-white text-xl font-semibold font-['Poppins'] leading-7"
              >
                Chantal John
              </div>
              <div
                class="self-stretch relative justify-center text-light-text-tertiary dark:text-[#a2a2a2] text-sm font-medium font-['Poppins']"
              >
                Kia Student
              </div>
            </div>
            <div
              class="self-stretch relative justify-center text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium font-['Poppins']"
            >
              It is a long established fact that a reader will be distracted by
              the readable content of a page when looking at its layout. The
              point of using Lorem Ipsum is that it has a more-or-less normal
              distribution of letters, as opposed to using
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="px-4 md:px-8 lg:px-24 w-full">
      <div class="max-w-6xl mx-auto">
        <div class="w-full py-8 bg-gradient-dark dark:bg-gradient-light rounded-[32px] flex flex-col justify-center items-center gap-16">
          <div
            class="self-stretch flex flex-col justify-center items-center gap-8"
          >
            <img
              class="w-[100.97px] h-[108.74px] relative"
              src="/YV.svg"
              alt="Youversity Logo"
            />
            <div
              class="max-w-[442px] relative text-center justify-center dark:text-black text-white text-[32px] font-bold font-['Poppins'] capitalize leading-10"
            >
              You can Discover and explore variety of trending courses.
            </div>
          </div>
          <div
            class="w-[238px] px-8 pt-[15px] pb-4 bg-[#ee3d4e] rounded-lg shadow-[0px_4px_6px_-1px_rgba(99,55,174,0.25)] shadow-[0px_4px_6px_-1px_rgba(99,55,174,0.25)] shadow-[inset_0px_2px_4px_0px_rgba(99,55,174,0.25)] inline-flex justify-center items-center gap-4"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="arrow-up-right-03">
                <path
                  id="Vector"
                  d="M16.5 7.5L6 18"
                  stroke="#ffffff"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  id="Vector_2"
                  d="M8 6.18791C8 6.18791 16.0479 5.50949 17.2692 6.73079C18.4906 7.95209 17.812 16 17.812 16"
                  stroke="#ffffff"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </svg>
            <button
              on:click={navigateToLogin}
              class="relative justify-center text-white text-base font-semibold font-['Poppins'] leading-normal"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
  <!-- Footer -->
  <Footer />
</div>

<style>
  :global(body) {
    @apply antialiased;
  }

  .hide-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  /* Initial styles for containers */
  #thumbnailContainer {
    opacity: 1;
    transition: opacity 0.5s ease;
  }

  #videoContainer {
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .video-wrapper {
    position: relative;
  }

  .notch {
    position: absolute;
    top: 1px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 30px;
    background-color: #303030;
    border-radius: 8px;
    z-index: 10;
    transition: all 0.3s ease;
    opacity: 0;
  }

  .notch::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 60%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    background-color: #D9D9D9;
    border-radius: 100%;
    transition: all 0.3s ease;
  }

  /* Tablet screens */
  @media (min-width: 768px) {
    .notch {
      width: 130px;
      height: 38px;
      border-radius: 10px;
    }

    .notch::before {
      width: 7px;
      height: 7px;
    }
  }

  /* Desktop screens */
  @media (min-width: 1024px) {
    .notch {
      width: 157px;
      height: 47px;
      border-radius: 12px;
    }

    .notch::before {
      width: 9px;
      height: 9px;
      top: 32px;
    }
  }
</style>
