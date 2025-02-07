<script lang="ts">
  export let show: boolean = false;
  import { loadingState } from '$lib/stores/loadingState';
  import { page } from '$app/stores';

  // Only show loading overlay for non-course-generation loading states
  $: shouldShowOverlay = $loadingState.isLoading && 
                        !$loadingState.isCreateCourse && 
                        show;

  function getLoadingMessage($loadingState: any) {
    if ($loadingState.currentStep) {
      return $loadingState.currentStep;
    }

    if ($loadingState.currentModule === 0) {
      return "Generating course structure...";
    }

    if ($loadingState.currentModule <= $loadingState.totalModules) {
      return `Searching videos for Module ${$loadingState.currentModule}${
        $loadingState.currentModuleTitle ? `: ${$loadingState.currentModuleTitle}` : ''
      }`;
    }

    return "Finalizing your course...";
  }

  function getDetailedLoadingMessage($loadingState: any) {
    if ($loadingState.currentStep) {
      return $loadingState.currentStep;
    }

    if ($loadingState.currentModule === 0) {
      return "Our AI is analyzing your objective and creating a personalized course structure...";
    }

    if ($loadingState.currentModule <= $loadingState.totalModules) {
      const progress = Math.round(($loadingState.currentModule / $loadingState.totalModules) * 100);
      return `Progress: ${progress}% - Module ${$loadingState.currentModule} of ${$loadingState.totalModules}`;
    }

    return "Creating quizzes, refining content, and preparing your complete course...";
  }
</script>

{#if shouldShowOverlay}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-0">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg transform transition-all">
      <div class="p-4 sm:p-6 md:p-8">
        {#if $loadingState.error}
          <div class="text-red-500 mb-4 text-center">
            <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-lg font-semibold">{$loadingState.error}</p>
          </div>
        {:else}
          <div class="flex flex-col items-center">
            <!-- Loading Spinner -->
            <div class="relative mb-6">
              <div class="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-b-2 border-blue-600"></div>
              {#if $loadingState.progress > 0}
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-sm font-medium text-blue-600">{Math.round($loadingState.progress)}%</span>
                </div>
              {/if}
            </div>

            <!-- Main Loading Message -->
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-2 text-center">
              {getLoadingMessage($loadingState)}
            </h3>

            <!-- Detailed Message -->
            <p class="text-sm sm:text-base text-gray-600 text-center max-w-xs sm:max-w-sm md:max-w-md mx-auto">
              {getDetailedLoadingMessage($loadingState)}
            </p>

            <!-- Progress Bar -->
            {#if $loadingState.progress > 0}
              <div class="w-full h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                <div 
                  class="h-full bg-blue-600 rounded-full transition-all duration-300 ease-in-out"
                  style="width: {$loadingState.progress}%"
                ></div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if} 