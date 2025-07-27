<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let showModal = false;
  export let courseTitle: string;
  export let courseDescription: string;
  export let courseThumbnail: string = '/images/course-placeholder.png';

  function closeModal() {
    showModal = false;
    dispatch('close');
  }

  function viewCourse() {
    closeModal();
    dispatch('viewCourse');
  }

  function continueToLibrary() {
    closeModal();
    dispatch('continueToLibrary');
  }
</script>

{#if showModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
    on:click|self={closeModal}
  >
    <div class="w-full max-w-md bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-2xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 bg-brand-red rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">
            Your course is ready!
          </h2>
        </div>
        <button 
          on:click={closeModal} 
          class="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Course Preview Image -->
      <div class="px-4 pb-4">
        <div class="relative rounded-2xl overflow-hidden">
          <img
            src={courseThumbnail}
            alt="Course thumbnail"
            class="w-full h-48 object-cover"
          />
          <div class="absolute top-3 right-3">
            <button class="p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="white" stroke-width="1.5"/>
                <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="white" stroke-width="1.5"/>
                <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="white" stroke-width="1.5"/>
                <path d="M8.72852 10.7495L15.2285 7.75M8.72852 13.25L15.2285 16.2495" stroke="white" stroke-width="1.5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Course Info -->
      <div class="px-4 pb-4">
        <h3 class="text-light-text-primary dark:text-dark-text-primary text-h4-medium mb-2 leading-tight">
          {courseTitle || 'Untitled Course'}
        </h3>
        <p class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body leading-relaxed">
          {courseDescription || 'Explore how social media impacts mental health, relationships, and decision-making in the digital age.'}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="p-4 space-y-3">
        <button
          on:click={viewCourse}
          class="w-full h-12 bg-brand-red hover:bg-ButtonHover text-white text-semibody-medium rounded-lg transition-colors flex items-center justify-center"
        >
          View Course
        </button>
        <button
          on:click={continueToLibrary}
          class="w-full h-12 bg-Green hover:bg-GreenHover text-white text-semibody-medium rounded-lg transition-colors flex items-center justify-center"
        >
          Continue to video library
        </button>
      </div>
    </div>
  </div>
{/if} 