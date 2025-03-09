<script lang="ts">
  import LandingHeader from '$lib/components/LandingHeader.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<div class="min-h-screen flex flex-col bg-content-gradient-light dark:bg-content-gradient-dark">
  <!-- Landing Header -->
  <LandingHeader />
  
  <!-- About Content -->
  <div class="flex flex-col px-4 lg:px-0 py-8 gap-16 lg:gap-30">
    <div class="flex flex-col  gap-8">
    <!-- Hero Section -->
    <div class="max-w-[818px] mx-auto">
      <h1 class="text-h3-landing-mobile lg:text-h3-landing text-light-text-secondary dark:text-dark-text-secondary text-center mb-4">What is Youversity About?</h1>
      <p class=" text-light-text-tertiary dark:text-dark-text-tertiary text-center">
        Youversity is not just another learning platform—it's your gateway to transforming passive YouTube watching into structured, meaningful learning experiences. We curate and organize educational content from YouTube into coherent courses, making it easier for you to acquire new skills and knowledge in a systematic way.
      </p>
    </div>
      
      <!-- Screenshot/Demo Image -->
      <div class="relative rounded-xl overflow-hidden border border-light-border dark:border-dark-border mb-8">
        <img src="/images/landing/CourseModule-Enrolled.png" alt="Youversity Platform Demo" class="w-full h-auto" />
        <div
        class="absolute inset-0 w-full h-full mx-0 mt-[20px] lg:mt-[142px] bg-content-gradient-light dark:bg-content-gradient-dark pointer-events-none z-10"
      ></div>
      </div>
    
    <!-- Mission Section -->
    <div class="">
      <h2 class="text-2xl font-bold text-black dark:text-white mb-4">Mission</h2>
      <p class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary">
        Empower learners with AI-driven educational tools that transform random YouTube content into structured learning experiences, making education more accessible, engaging, and effective for everyone.
      </p>
    </div>
    
    <!-- Vision Section -->
    <div class="">
      <h2 class="text-2xl font-bold text-black dark:text-white mb-4">Vision</h2>
      <p class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary">
        To create a world where learning is accessible to everyone, powered by intelligent technology that adapts to individual learning styles and preferences.
      </p>
    </div>
    </div>

     <!-- Why Choose Us Section -->
     <div class="flex flex-col gap-6">
      <h2 class="text-h3-landing-mobile lg:text-h3-landing text-light-text-secondary dark:text-dark-text-secondary text-center">Why Choose Us?</h2>
      <div class="space-y-8">
        <div class="px-8 py-4 bg-black/5 dark:bg-white/10 rounded-2xl">
          <p class="text-semi-body text-Green2 text-center">AI-powered content curation and organization</p>
        </div>
        <div class="px-8 py-4 bg-black/5 dark:bg-white/10 rounded-2xl">
          <p class="text-semi-body text-Green2 text-center">Structured learning paths for efficient skill acquisition</p>
        </div>
        <div class="px-8 py-4 bg-black/5 dark:bg-white/10 rounded-2xl">
          <p class="text-semi-body text-Green2 text-center">Learn at your own pace with personalized recommendations</p>
        </div>
      </div>
    </div> 
    
   
    
    <!-- Testimonials Section -->
    <div class="mb-12">
      <h2 class="text-h3-landing-mobile lg:text-h3-landing text-light-text-secondary dark:text-dark-text-secondary text-center mb-6">What our Early Users Say</h2>
      <div class="space-y-6">
        <!-- Testimonial 1 -->
        <div class="flex gap-4">
          <div class="flex-shrink-0">
            <img src="/images/landing/profile-picture.png" alt="User Avatar" class="w-10 h-10 rounded-full" />
          </div>
          <div>
            <h3 class="font-semibold text-black dark:text-white">Chantal John</h3>
            <p class="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-2">Data Scientist</p>
            <p class="text-light-text-secondary dark:text-dark-text-secondary">
              "I was overwhelmed by the number of YouTube videos on machine learning. Youversity helped me organize my learning journey and I was able to complete a comprehensive ML course in just 3 weeks!"
            </p>
          </div>
        </div>
        
        <!-- Testimonial 2 -->
        <div class="flex gap-4">
          <div class="flex-shrink-0">
            <img src="/images/landing/profile-picture.png" alt="User Avatar" class="w-10 h-10 rounded-full" />
          </div>
          <div>
            <h3 class="font-semibold text-black dark:text-white">Michael Chen</h3>
            <p class="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-2">Software Developer</p>
            <p class="text-light-text-secondary dark:text-dark-text-secondary">
              "The way Youversity structures content is amazing. I've been trying to learn React for months, jumping between random videos. With Youversity, I had a clear path and finally built my first full application."
            </p>
          </div>
        </div>
        
        <!-- Testimonial 3 -->
        <div class="flex gap-4">
          <div class="flex-shrink-0">
            <img src="/images/landing/profile-picture.png" alt="User Avatar" class="w-10 h-10 rounded-full" />
          </div>
          <div>
            <h3 class="font-semibold text-black dark:text-white">Sarah Williams</h3>
            <p class="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-2">Digital Marketing Specialist</p>
            <p class="text-light-text-secondary dark:text-dark-text-secondary">
              "I love how Youversity takes the guesswork out of learning. The AI recommendations are spot-on, and I've discovered content I would never have found on my own. It's transformed how I approach professional development."
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CTA Section -->
    <div class="bg-gradient-dark dark:bg-gradient-light rounded-2xl p-8 text-center mb-12">
      <div class="flex flex-col items-center">
        <img src="/YV.svg" alt="Youversity Logo" class="w-16 h-16 mb-4" />
        <div class="flex flex-col text-2xl md:text-3xl font-bold dark:text-black text-white mb-4 "><span> Join Us On Your</span> <span>Learning Journey</span></div>
        <p class="dark:text-light-text-secondary text-dark-text-secondary mb-6 max-w-lg mx-auto">
          Whether you're picking up a new skill or mastering an advanced topic, we’re here to make learning effortless, engaging, and effective.        </p>
        <a href="/signup" class="bg-brand-red text-white px-8 py-4 gap-4 rounded-lg font-semibold hover:bg-opacity-90 transition-colors inline-flex items-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="arrow-up-right-03">
            <path id="Vector" d="M16.5 7.5L6 18" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
            <path id="Vector_2" d="M8 6.18791C8 6.18791 16.0479 5.50949 17.2692 6.73079C18.4906 7.95209 17.812 16 17.812 16" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            </svg>
          <span>Get Started</span>
        </a>
      </div>
    </div>
  </div>
  
  <!-- Footer -->
  <Footer />
</div> 