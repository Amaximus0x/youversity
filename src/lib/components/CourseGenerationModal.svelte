<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { loadingState } from '$lib/stores/loadingState';
  import { modalState } from '$lib/stores/modalState';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';

  // Add debugging logs
  $: console.log('Modal Debug State:', {
    isLoading: $loadingState.isLoading,
    isInitialBuild: $loadingState.isInitialBuild,
    courseId: $loadingState.courseId,
    courseTitle: $loadingState.courseTitle,
    isMinimized: $modalState.isMinimized,
    currentPage: $page.url.pathname,
    shouldShowModal: ($loadingState.isCreateCourse && !$loadingState.isInitialBuild) || 
                    ($loadingState.courseId && $modalState.isMinimized)
  });

  function getProgressMessage($loadingState: any) {
    if ($loadingState.progress === 100) {
      return "Course is ready";
    }
    if ($loadingState.currentStep) {
      return $loadingState.currentStep;
    }
    return "Preparing your course...";
  }

  function handleOutsideClick() {
    modalState.setMinimized(true);
  }

  function handleMaximize() {
    modalState.setMinimized(false);
  }

  async function handleViewCourse() {
    if ($loadingState.courseId) {
      const courseId = $loadingState.courseId;
      
      // First clear both states completely
      loadingState.clearState();
      modalState.reset();
      
      // Force remove from localStorage
      if (browser) {
        localStorage.removeItem('loadingState');
        localStorage.removeItem('modalState');
      }
      
      // Then navigate
      await goto(`/course/${courseId}`);
    }
  }

  function handleDismiss() {
    modalState.reset();
    loadingState.clearState();
  }

  function handleRetry() {
    loadingState.clearError();
    goto('/create-course');
  }

  onMount(() => {
    if (browser) {
      // Log initial state on mount
      console.log('Modal Mounted:', {
        storedLoadingState: localStorage.getItem('loadingState'),
        storedModalState: localStorage.getItem('modalState')
      });

      // Restore minimized state from localStorage if needed
      const storedModalState = localStorage.getItem('modalState');
      if (storedModalState) {
        const { isMinimized } = JSON.parse(storedModalState);
        modalState.setMinimized(isMinimized);
      }
    }
  });

  $: shouldShowModal = ($loadingState.isCreateCourse && !$loadingState.isInitialBuild) || 
                      ($loadingState.courseId && $modalState.isMinimized);

  $: isComplete = $loadingState.progress === 100;
</script>

{#if shouldShowModal}
  {#if $modalState.isMinimized}
    <!-- Minimized version in top-right corner -->
    <div 
      class="modal-content fixed top-4 right-4 z-50 w-[400px]"
      in:fly={{ x: 50, duration: 300 }}
      out:fade
    >
      <div 
        class="bg-white dark:bg-dark-background-primary rounded-2xl shadow-lg border border-[rgba(0,0,0,0.05)] px-4 pt-2 pb-4 cursor-pointer relative"
        on:click={handleMaximize}
      >
        <!-- Add close button for error state -->
        {#if $loadingState.error}
          <button
            class="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
            on:click|stopPropagation={handleDismiss}
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}

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
      class="modal-content fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      transition:fade={{ duration: 200 }}
      on:click={handleOutsideClick}
    >
      <div 
        class="bg-white dark:bg-dark-background-primary rounded-2xl shadow-lg max-w-lg w-full mx-4 p-6 relative"
        on:click|stopPropagation
      >
        <!-- Error State -->
        {#if $loadingState.error}
          <div class="text-center">
            <div class="text-red-500 mb-6">
              <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 class="text-lg font-semibold mb-2">Course Generation Failed</h3>
              <p class="text-sm text-gray-600 mb-4">{$loadingState.error}</p>
            </div>
            
            <div class="flex gap-3 justify-center">
              <button
                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                on:click={handleDismiss}
              >
                Dismiss
              </button>
              <button
                class="px-4 py-2 bg-brand-navy hover:bg-brand-darkBlue text-white rounded-lg text-sm font-medium transition-colors"
                on:click={handleRetry}
              >
                Try Again
              </button>
            </div>
          </div>
        {:else}
          <!-- Success/Loading State -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-body-semibold text-Black dark:text-White">
              {isComplete ? "Course is ready" : "Generating Complete Course"}
            </h2>
            
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