<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let showModal = false;
  export let courseTitle: string;
  export let courseDescription: string;
  export let courseThumbnail: string = '/images/videoCardThumb.png';

  function closeModal() {
    showModal = false;
    dispatch('close');
  }

  function viewCourse() {
    // TODO: Implement view course functionality
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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    on:click|self={closeModal}
  >
    <div class="w-96 p-4 bg-BackgroundRed rounded-2xl inline-flex flex-col justify-end items-start gap-4">
      <div class="self-stretch flex flex-col justify-start items-start gap-4">
        <!-- Header -->
        <div class="self-stretch h-6 rounded-2xl flex flex-col justify-between items-center">
          <div class="self-stretch flex flex-col justify-start items-start">
            <div class="self-stretch inline-flex justify-start items-center">
              <div class="flex-1 justify-center text-light-text-primary dark:text-dark-text-primary text-base font-semibold font-['Poppins'] leading-normal">
                Your course is ready!
              </div>
              <div class="w-6 h-6 relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#EB434A"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Course Preview -->
        <div class="self-stretch  rounded-2xl flex flex-col justify-start items-start overflow-hidden">
          <!-- Image with Share Button -->
          <div class="self-stretch px-4 pt-4 pb-24 inline-flex justify-end items-start gap-2.5 overflow-hidden relative">
            <img
              src= {courseThumbnail}
              alt="Course preview"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <button class="p-2 bg-black/30 rounded-full flex justify-start items-center gap-2.5 relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="white" stroke-width="1.5"/>
                <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="white" stroke-width="1.5"/>
                <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="white" stroke-width="1.5"/>
                <path d="M8.72852 10.7495L15.2285 7.75M8.72852 13.25L15.2285 16.2495" stroke="white" stroke-width="1.5"/>
              </svg>
            </button>
          </div>

          <!-- Course Info -->
          <div class="self-stretch p-4 flex flex-col justify-start items-start gap-6">
            <div class="self-stretch flex flex-col justify-start items-start gap-4">
              <div class="self-stretch flex flex-col justify-start items-start gap-2">
                <div class="self-stretch min-h-[56px] text-light-text-primary dark:text-dark-text-primary text-base font-semibold font-['Poppins'] leading-7">
                  {courseTitle || 'Untitled Course'}
                </div>
                <div class="self-stretch min-h-[40px] text-light-text-tertiary dark:text-dark-text-tertiary text-sm font-normal font-['Poppins'] leading-5">
                  {courseDescription || 'Explore how social media impacts mental health, relationships, and decision-making in the digital age.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="self-stretch flex flex-col justify-start items-start gap-4">
        <button
          on:click={viewCourse}
          class="self-stretch h-10 pl-2 pr-1 py-2 bg-brand-red rounded-lg inline-flex justify-center items-center gap-2"
        >
          <span class="text-white text-sm font-normal font-['Poppins'] leading-snug">View Course</span>
        </button>
        <button
          on:click={continueToLibrary}
          class="self-stretch h-10 px-4 py-2 bg-Green rounded-lg inline-flex justify-center items-center gap-4"
        >
          <span class="text-white text-sm font-medium font-['Poppins']">Continue to video library</span>
        </button>
      </div>
    </div>
  </div>
{/if} 