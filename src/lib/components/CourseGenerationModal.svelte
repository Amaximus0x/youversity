<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { loadingState } from '$lib/stores/loadingState';
  import { goto } from '$app/navigation';

  function getProgressMessage($loadingState: any) {
    if ($loadingState.progress === 100) {
      return "Course is ready";
    }
    if ($loadingState.currentStep) {
      return $loadingState.currentStep;
    }
    return "Preparing your course...";
  }

  let isMinimized = false;

  function handleOutsideClick() {
    isMinimized = true;
  }

  function handleMaximize() {
    isMinimized = false;
  }

  function handleViewCourse() {
    if ($loadingState.courseId) {
      goto(`/course/${$loadingState.courseId}`);
      loadingState.clearState();
    }
  }

  $: isComplete = $loadingState.progress === 100;
  // Only show modal when isLoading is true AND isInitialBuild is false
  $: shouldShowModal = $loadingState.isLoading && !$loadingState.isInitialBuild;
</script>

{#if shouldShowModal}
  {#if isMinimized}
    <!-- Minimized version in top-right corner -->
    <div 
      class="fixed top-4 right-4 z-50 w-[400px]"
      in:fly={{ x: 50, duration: 300 }}
      out:fade
    >
      <div 
        class="bg-white dark:bg-dark-background-primary rounded-2xl shadow-lg border border-[rgba(0,0,0,0.05)] px-4 pt-2 pb-4 cursor-pointer"
        on:click={handleMaximize}
      >
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-body-semibold text-Black dark:text-White">
              {isComplete ? "Course is ready" : "Generating Complete Course"}
            </h2>
          </div>

          <div class="flex items-end p-3.5">
            {#if isComplete}
              <img 
                src="/images/checkmark-circle.svg" 
                alt="Success" 
                class="w-4 h-4"
              />
            {:else}
              <img 
                src="/images/loading-spin.gif" 
                alt="Loading" 
                class="w-4 h-4"
              />
            {/if}
          </div>
        </div>

        {#if !isComplete}
          <div class="relative h-3 bg-Black/5 rounded-full overflow-hidden mb-4">
            <div 
              class="absolute left-0 top-0 h-full bg-[#42C1C8] rounded-full transition-all duration-300 ease-out"
              style="width: {$loadingState.progress}%"
            />
          </div>
        {/if}

        <p class="text-semi-body text-Black dark:text-White truncate mb-2">
          {$loadingState.courseTitle}
        </p>

        {#if isComplete}
          <button
            class="w-full bg-brand-navy hover:bg-brand-darkBlue text-white rounded-xl py-3 text-body transition-colors duration-200"
            on:click|stopPropagation={handleViewCourse}
          >
            View Course
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Full screen modal -->
    <div 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      transition:fade={{ duration: 200 }}
      on:click={handleOutsideClick}
    >
      <div 
        class="w-[746px] bg-white dark:bg-dark-background-primary rounded-2xl shadow-lg border border-[rgba(0,0,0,0.05)] px-4 pt-2 pb-4"
        in:fade={{ duration: 200, delay: 200 }}
        on:click|stopPropagation
      >
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-body-semibold text-Black dark:text-White">
              {isComplete ? "Course is ready" : "Generating Complete Course"}
            </h2>
          </div>

          <div class="flex items-end p-3.5">
            {#if isComplete}
              <img 
                src="/images/checkmark-circle.svg" 
                alt="Success" 
                class="w-4 h-4"
              />
            {:else}
              <img 
                src="/images/loading-spin.gif" 
                alt="Loading" 
                class="w-4 h-4"
              />
            {/if}
          </div>
        </div>

        {#if !isComplete}
          <div class="relative h-3 bg-Black/5 rounded-full overflow-hidden mb-4">
            <div 
              class="absolute left-0 top-0 h-full bg-[#42C1C8] rounded-full transition-all duration-300 ease-out"
              style="width: {$loadingState.progress}%"
            />
          </div>
        {/if}

        <p class="text-semi-body text-Black dark:text-White mb-4">
          {$loadingState.courseTitle}
        </p>

        {#if isComplete}
          <button
            class="w-full bg-brand-navy hover:bg-brand-darkBlue text-white rounded-xl py-3 text-body transition-colors duration-200"
            on:click={handleViewCourse}
          >
            View Course
          </button>
        {/if}
      </div>
    </div>
  {/if}
{/if}

<style>
  /* Add hover effect for minimized state */
  .minimized:hover {
    transform: scale(1.02);
    transition: transform 0.2s ease-in-out;
  }
</style> 