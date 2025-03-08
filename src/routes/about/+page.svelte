<script lang="ts">
  import LandingHeader from '$lib/components/LandingHeader.svelte';
</script>

<div class="min-h-screen flex flex-col">
  <!-- Landing Header -->
  <LandingHeader />
  
  <!-- About Content -->
  <section class="flex-1 px-4 py-12 md:py-16 bg-dark-bg-primary">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-h1 text-white mb-8 text-center">About Youversity</h1>
      
      <div class="bg-dark-bg-secondary rounded-xl p-6 md:p-8 mb-8">
        <h2 class="text-h2 text-white mb-4">Our Mission</h2>
        <p class="text-18-28 text-white/80 mb-6">
          At Youversity, we believe that learning should be accessible, engaging, and personalized. 
          Our mission is to transform passive YouTube watching into active learning experiences that 
          help you achieve your educational goals.
        </p>
        
        <p class="text-18-28 text-white/80">
          We use AI technology to curate and organize educational content from YouTube into 
          structured courses, making it easier for you to learn new skills and knowledge in a 
          systematic way.
        </p>
      </div>
      
      <div class="bg-dark-bg-secondary rounded-xl p-6 md:p-8 mb-8">
        <h2 class="text-h2 text-white mb-4">Our Story</h2>
        <p class="text-18-28 text-white/80 mb-6">
          Youversity was founded by a team of educators and technologists who recognized the 
          vast amount of educational content available on YouTube but saw how difficult it was 
          for learners to navigate and organize this content effectively.
        </p>
        
        <p class="text-18-28 text-white/80">
          We created Youversity to solve this problem, using AI to analyze, categorize, and 
          structure YouTube content into coherent learning paths that help you achieve your 
          educational goals more efficiently.
        </p>
      </div>
      
      <div class="bg-dark-bg-secondary rounded-xl p-6 md:p-8">
        <h2 class="text-h2 text-white mb-4">Our Values</h2>
        <ul class="space-y-4">
          <li class="flex items-start">
            <div class="w-8 h-8 bg-brand-red/20 rounded-full flex items-center justify-center mr-4 mt-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12L10 17L20 7" stroke="#EE434A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 class="text-h4-medium text-white mb-1">Accessibility</h3>
              <p class="text-semi-body text-white/80">
                We believe education should be accessible to everyone, regardless of background or resources.
              </p>
            </div>
          </li>
          
          <li class="flex items-start">
            <div class="w-8 h-8 bg-brand-turquoise/20 rounded-full flex items-center justify-center mr-4 mt-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12L10 17L20 7" stroke="#42C1C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 class="text-h4-medium text-white mb-1">Innovation</h3>
              <p class="text-semi-body text-white/80">
                We continuously explore new technologies and approaches to improve the learning experience.
              </p>
            </div>
          </li>
          
          <li class="flex items-start">
            <div class="w-8 h-8 bg-brand-navy/20 rounded-full flex items-center justify-center mr-4 mt-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12L10 17L20 7" stroke="#2A4D61" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 class="text-h4-medium text-white mb-1">Community</h3>
              <p class="text-semi-body text-white/80">
                We foster a supportive community where learners can connect, collaborate, and grow together.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
  
  <!-- Footer -->
  <footer class="py-8 px-4 bg-light-bg-primary dark:bg-dark-bg-primary border-t border-light-border dark:border-dark-border">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
      <div class="flex items-center mb-4 md:mb-0">
        <img src="/YV.svg" alt="Youversity Logo" class="w-8 h-8 mr-2" />
        <span class="text-light-text-primary dark:text-dark-text-primary font-medium">Youversity</span>
      </div>
      
      <div class="text-light-text-tertiary dark:text-dark-text-tertiary text-mini-body">
        © {new Date().getFullYear()} Youversity. All rights reserved.
      </div>
    </div>
  </footer>
</div> 