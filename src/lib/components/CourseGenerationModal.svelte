<script lang="ts">
  import { fade } from 'svelte/transition';
  import { loadingState } from '$lib/stores/loadingState';

  function getProgressMessage($loadingState: any) {
    if ($loadingState.currentStep) {
      return $loadingState.currentStep;
    }
    return "Preparing your course...";
  }

  $: isComplete = $loadingState.progress === 100;
  // Only show modal when isLoading is true AND isInitialBuild is false
  $: shouldShowModal = $loadingState.isLoading && !$loadingState.isInitialBuild;
</script>

{#if shouldShowModal}
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="w-[746px] bg-white dark:bg-dark-background-primary rounded-2xl shadow-lg border border-[rgba(0,0,0,0.05)] px-4 pt-2 pb-4"
      in:fade={{ duration: 200, delay: 200 }}
    >
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-body-semibold text-Black dark:text-White">
            Generating Complete Course
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

      <div class="relative h-3 bg-Black/5 rounded-full overflow-hidden mb-4">
        <div 
          class="absolute left-0 top-0 h-full bg-[#42C1C8] rounded-full transition-all duration-300 ease-out"
          style="width: {$loadingState.progress}%"
        />
      </div>

      <p class="text-semi-body text-Black dark:text-White">{getProgressMessage($loadingState)}</p>
    </div>
  </div>
{/if} 