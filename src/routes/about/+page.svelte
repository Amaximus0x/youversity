<script lang="ts">
  import LandingHeader from '$lib/components/LandingHeader.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { theme } from '$lib/stores/theme';
    import { goto } from '$app/navigation';
</script>

<div class="min-h-screen flex flex-col bg-gradient-light dark:bg-gradient-dark">
  <!-- Landing Header -->
  <LandingHeader />
  
  <!-- About Content -->
  <div class="flex flex-col px-4 pt-8 lg:pt-12 lg:px-16 pb-[9rem] lg:pb-[12rem] gap-16 lg:gap-30">
    <div class="flex flex-col ">
    <!-- Hero Section -->
    <div class="max-w-[818px] mx-auto mb-8">
      <h1 class="text-h3-landing-mobile lg:text-h3-landing text-light-text-secondary dark:text-dark-text-secondary text-center mb-4">What is Youversity About?</h1>
      <p class="text-dark-text-tertiary dark:text-dark-text-tertiary text-center">
        Youversity is an AI-powered learning platform that lets you create and explore courses effortlessly. Search for curated content on any topic or generate your own structured course tailored to your learning goals. With AI-driven organization and personalization, Youversity makes learning flexible, accessible, and fully customizable to fit your needs.</p>
    </div>
      
    <!-- Screenshot/Demo Image -->
    <div class="relative rounded-xl overflow-hidden max-w-[1200 px] mx-auto">
      {#if $theme === 'light'}
        <img src="/images/landing/CourseModule-Enrolled-Light.png" alt="Youversity course module interface - light mode" class="w-full h-auto" />
      {:else}
        <img src="/images/landing/CourseModule-Enrolled-dark.png" alt="Youversity course module interface - dark mode" class="w-full h-auto" />
      {/if}
      <div
        class="absolute inset-0 w-full h-full mx-0 mt-[20px] lg:mt-[142px] bg-about-gradient-light dark:bg-about-gradient-dark pointer-events-none z-10"
      ></div>
    </div>
    
    <!-- Mission and Vision Section - Side by side on larger screens -->
    <div class="flex flex-col lg:flex-row lg:justify-between lg:gap-24 max-w-[1200px] mx-auto px-4 lg:px-0 pb-8 lg:pb-16">
      <!-- Mission Section -->
      <div class="w-full lg:w-[390px] mb-8 lg:mb-0">
        <h2 class="text-h3-mobile lg:text-h2 font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Mission</h2>
        <p class="text-body text-light-text-secondary dark:text-dark-text-secondary">
          Empowering learners with AI-driven education that adapts to their pace, curates the best content, and turns learning into a seamless experience.
        </p>
      </div>
      
      <!-- Vision Section -->
      <div class="w-full lg:w-[390px] lg:mt-14">
        <h2 class="text-h3-mobile lg:text-h2 font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Vision</h2>
        <p class="text-body text-light-text-secondary dark:text-dark-text-secondary">
          To revolutionize digital learning by making high-quality education accessible, intelligent, and personalized—bridging the gap between curiosity and mastery.
        </p>
      </div>
    </div>
    </div>

     <!-- Why Choose Us Section -->
      <section class="px-4 md:px-8 lg:px-24 w-full">
     <div class="max-w-[968px] mx-auto flex flex-col gap-6">
      <h2 class="text-h3-landing-mobile lg:text-h3-landing text-light-text-secondary dark:text-dark-text-secondary text-center">Why Choose Us?</h2>
      <div class="space-y-8">
        <div class="px-8 py-4 bg-Black/5 dark:bg-white/10 rounded-2xl">
          <p class="text-semi-body text-Green2 text-center">AI-powered content curation and organization</p>
        </div>
        <div class="px-8 py-4 bg-Black/5 dark:bg-white/10 rounded-2xl">
          <p class="text-semi-body text-Green2 text-center">Structured learning paths for efficient skill acquisition</p>
        </div>
        <div class="px-8 py-4 bg-Black/5 dark:bg-white/10 rounded-2xl">
          <p class="text-semi-body text-Green2 text-center">Learn at your own pace with personalized recommendations</p>
        </div>
      </div>
    </div> 
    </section>
   
    
    <!-- Testimonials Section -->
    <section class="px-4  w-full max-w-[1200px] mx-auto">
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
        class="w-11 h-11 relative rounded-full object-cover"
        src="/images/landing/Marie-Klaus.jpeg"
        alt="Marie Klaus"
      />
          <div
            class="flex-1 md:w-[390px] inline-flex flex-col justify-start items-start gap-4"
          >
            <div class="flex flex-col justify-start items-start gap-2">
              <div
                class="w-[143px] relative justify-center text-light-text-primary dark:text-dark-text-primary text-xl font-semibold font-['Poppins'] leading-7"
              >
                Marie Klaus
              </div>
              <div
                class="self-stretch relative justify-center text-light-text-tertiary dark:text-dark-text-tertiary text-sm font-medium font-['Poppins']"
              >
                Digital Marketer
              </div>
            </div>
            <div
              class="self-stretch relative justify-center text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium font-['Poppins']"
            >
              Learning has been so interesting and easy since I started using Youversity. The quizzes make me pay more attention to the courses and understand them better, unlike just watching from YouTube.
            </div>
          </div>
        </div>

        <!-- Second testimonial (centered in desktop) -->
        <div
          class="mb-6 md:mb-0 md:w-[454px] md:mt-16 inline-flex justify-start items-start gap-4"
        >
        <img
        class="w-11 h-11 relative rounded-full object-cover"
        src="/images/landing/James-Larry.jpeg"
        alt="James Larry"
      />
          <div
            class="flex-1 md:w-[390px] inline-flex flex-col justify-start items-start gap-4"
          >
            <div class="flex flex-col justify-start items-start gap-2">
              <div
                class="w-[143px] relative justify-center text-light-text-primary dark:text-dark-text-primary text-xl font-semibold font-['Poppins'] leading-7"
              >
                James Larry
              </div>
              <div
                class="self-stretch relative justify-center text-light-text-tertiary dark:text-dark-text-tertiary text-sm font-medium font-['Poppins']"
              >
                Video Editor
              </div>
            </div>
            <div
              class="self-stretch relative justify-center text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium font-['Poppins']"
            >
              I’ve explored so many topics with Youversity. It’s simple, intuitive, and helps me learn at my own pace.
            </div>
          </div>
        </div>

        <!-- Third testimonial -->
        <div class="md:w-[454px] inline-flex justify-start items-start gap-4">
          <img
            class="w-11 h-11 relative rounded-full object-cover"
            src="/images/landing/Jemilah.jpeg"
            alt="Jemilah"
          />
          <div
            class="flex-1 md:w-[390px] inline-flex flex-col justify-start items-start gap-4"
          >
            <div class="flex flex-col justify-start items-start gap-2">
              <div
                class="w-[143px] relative justify-center text-light-text-primary dark:text-dark-text-primary text-xl font-semibold font-['Poppins'] leading-7"
              >
                Jemilah
              </div>
              <div
                class="self-stretch relative justify-center text-light-text-tertiary dark:text-dark-text-tertiary text-sm font-medium font-['Poppins']"
              >
                Student
              </div>
            </div>
            <div
              class="self-stretch relative justify-center text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium font-['Poppins']"
            >
              Youversity makes learning so effortless. I love how I can dive into any topic and get structured guidance instantly.
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
            Join Us on Your<br>Learning Journey
            </div>
            <div class="max-w-[568px] text-center justify-center text-dark-text-tertiary dark:text-dark-text-tertiary text-body leading-snug">Whether you're picking up a new skill or mastering an advanced topic, we're here to make learning effortless, engaging, and effective.</div>
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
              on:click={() => goto("/login")}
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