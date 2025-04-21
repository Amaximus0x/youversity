<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { finalLoadingState } from "$lib/stores/loadingState";
  import { modalState } from "$lib/stores/modalState";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";

  // Add debugging logs
  $: console.log("Modal Debug State:", {
    isLoading: $finalLoadingState.isLoading,
    isInitialBuild: $finalLoadingState.isInitialBuild,
    courseId: $finalLoadingState.courseId,
    courseTitle: $finalLoadingState.courseTitle,
    isMinimized: $modalState.isMinimized,
    currentPage: $page.url.pathname,
    shouldShowModal:
      ($finalLoadingState.isCreateCourse &&
        !$finalLoadingState.isInitialBuild) ||
      ($finalLoadingState.courseId && $modalState.isMinimized),
  });

  function getGenerationStep($loadingState: any) {
    if ($loadingState.currentStep) {
      return $loadingState.currentStep;
    }
    return "Generating your complete course...";
  }

  function handleOutsideClick() {
    modalState.setMinimized(true);
  }

  function handleMaximize() {
    modalState.setMinimized(false);
  }

  async function handleViewCourse() {
    if ($finalLoadingState.courseId) {
      const courseId = $finalLoadingState.courseId;

      // Dispatch event before navigating
      console.log('[Modal] Dispatching viewCourseClicked event');
      window.dispatchEvent(new CustomEvent('viewCourseClicked'));

      // Navigate first
      // currentModuleStore.set(-1);
      await goto(`/course/${courseId}`);

      // Then clear states
      finalLoadingState.clearState();
      modalState.reset();

      // Force remove from localStorage
      if (browser) {
        localStorage.removeItem("finalLoadingState");
        localStorage.removeItem("modalState");
      }
    }
  }

  function handleDismiss() {
    modalState.reset();
    finalLoadingState.clearState();
  }

  function handleRetry() {
    finalLoadingState.clearError();
    goto("/create-course");
  }

  onMount(() => {
    if (browser) {
      // Log initial state on mount
      console.log("Modal Mounted:", {
        storedLoadingState: localStorage.getItem("finalLoadingState"),
        storedModalState: localStorage.getItem("modalState"),
      });

      // Restore minimized state from localStorage if needed
      const storedModalState = localStorage.getItem("modalState");
      if (storedModalState) {
        const { isMinimized } = JSON.parse(storedModalState);
        modalState.setMinimized(isMinimized);
      }
    }
  });

  $: shouldShowModal =
    $finalLoadingState.isLoading ||
    $finalLoadingState.courseId ||
    $modalState.isMinimized;

  $: isComplete = $finalLoadingState.progress === 100;

  // Dispatch event when course is complete and modal is not minimized
  $: if (browser && isComplete && !$modalState.isMinimized) {
    // Use timeout to ensure button is rendered before event fires
    setTimeout(() => {
      console.log('[Modal] Dispatching courseReadyForViewing event');
      window.dispatchEvent(new CustomEvent('courseReadyForViewing'));
    }, 300); // Increased delay
  }
</script>

{#if shouldShowModal}
  {#if $modalState.isMinimized}
    <!-- Minimized version in top-right corner -->
    <div
      class="modal-content fixed top-28 right-4 z-50 w-[400px]"
      in:fly={{ x: 50, duration: 300 }}
      out:fade
    >
      <button
        class="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-2xl shadow-lg border border-light-border dark:border-dark-border px-4 pt-2 pb-4 cursor-pointer relative"
        on:click={handleMaximize}
      >
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-body-semibold text-Black dark:text-White">
            {isComplete ? "Course is ready" : "Getting your course ready"}
          </h2>
          <div class="flex items-center p-2">
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
          <div
            class="relative h-3 bg-Black/5 dark:bg-White/10 rounded-full overflow-hidden mb-4"
          >
            <div
              class="absolute left-0 top-0 h-full bg-[#42C1C8] rounded-full transition-all duration-300 ease-out"
              style="width: {$finalLoadingState.progress}%"
            />
          </div>
        {/if}

        <p class="text-semi-body text-Black dark:text-White mb-4">
          {#if isComplete}
            {$finalLoadingState.courseTitle}
          {:else}
            {getGenerationStep($finalLoadingState)}
          {/if}
        </p>

        {#if isComplete}
          <button
            class="w-full bg-Green dark:bg-Green2 hover:bg-Green2 text-white rounded-xl py-3 text-body transition-colors duration-200"
            on:click|stopPropagation={handleViewCourse}
            data-tour="view-course-button"
          >
            View Course
          </button>
        {/if}
      </button>
    </div>
  {:else}
    <!-- Full screen modal with popup styling -->
    <button
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      transition:fade={{ duration: 200 }}
      on:click={handleOutsideClick}
    >
      <button
        class="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-2xl shadow-lg w-[390px] p-4 relative"
        on:click|stopPropagation
        in:fly={{ y: 20, duration: 300 }}
      >
        {#if $finalLoadingState.error}
          <div class="text-center">
            <div class="text-red-500 mb-6">
              <svg
                class="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 class="text-lg font-semibold text-Black dark:text-White mb-2">
                Course Generation Failed
              </h3>
              <p class="text-sm text-brand-red mb-4">
                {$finalLoadingState.error}
              </p>
            </div>

            <div class="flex gap-3 justify-center">
              <button
                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                on:click={handleDismiss}
              >
                Dismiss
              </button>
              <button
                class="px-4 py-2 bg-Green dark:bg-Green2 hover:bg-Green2 text-white rounded-lg text-sm font-medium transition-colors"
                on:click={handleRetry}
              >
                Try Again
              </button>
            </div>
          </div>
        {:else}
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <h2 class="text-body-semibold text-Black dark:text-White">
                  {isComplete ? "Course is ready" : "Getting your Course Ready"}
                </h2>
                <div class="flex items-center">
                  {#if isComplete}
                    <img
                      src="/images/checkmark-circle.svg"
                      alt="Success"
                      class="w-6 h-6"
                    />
                  {:else}
                    <img
                      src="/images/loading-spin.gif"
                      alt="Loading"
                      class="w-[51px] h-[51px]"
                    />
                  {/if}
                </div>
              </div>

              {#if !isComplete}
                <div
                  class="relative h-3 bg-Black/5 dark:bg-white/10 rounded-full overflow-hidden"
                >
                  <div
                    class="absolute left-0 top-0 h-full bg-brand-turquoise rounded-full transition-all duration-300 ease-out"
                    style="width: {$finalLoadingState.progress}%"
                  />
                </div>
              {/if}
            </div>

            {#if !isComplete}
              <p class="text-semi-body text-Black dark:text-White">
                {getGenerationStep($finalLoadingState)}
              </p>
              <!-- <p class="text-semi-body text-Black dark:text-White">
                Setting things up for smooth learning experience
              </p> -->
            {:else}
              <p class="text-semi-body text-Black dark:text-White mb-4">
                {$finalLoadingState.courseTitle}
              </p>
              <button
                class="w-full bg-Green dark:bg-Green2 hover:bg-Green2 text-white rounded-xl py-4 text-body-semibold transition-colors duration-200"
                data-tour="view-course-button"
                on:click={handleViewCourse}
              >
                View Course
              </button>
            {/if}
          </div>
        {/if}
      </button>
    </button>
  {/if}
{/if}

<style>
  /* Add hover effect for minimized state */
  .minimized:hover {
    transform: scale(1.02);
    transition: transform 0.2s ease-in-out;
  }
</style>
