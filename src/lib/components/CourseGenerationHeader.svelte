<script lang="ts">
  import { initialLoadingState } from '$lib/stores/loadingState';
  import { fade } from 'svelte/transition';

  function getProgressMessage($loadingState: any) {
    if ($loadingState.progress === 100) {
      return "Course structure is ready.";
    }
    if ($loadingState.currentStep) {
      return $loadingState.currentStep;
    }
    return "Analyzing your course objective...";
  }

  $: isComplete = $initialLoadingState.progress === 100;
</script>

<div 
  class="max-w-[746px] h-auto rounded-2xl shadow-sm border border-light-border dark:border-dark-border px-4 pt-2 pb-4 mb-6"
  in:fade={{ duration: 200 }}
>
  <div class="flex items-center justify-between">

    <div>
      <h2 class="text-body-semibold text-Black dark:text-White">
        Generating Course
      </h2>
    </div>

    <div class="flex items-end p-3.5">
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
        class="w-12 h-12"
      />
      {/if}
    </div>
  </div>
  

  <div class="relative h-3 bg-Black/5 dark:bg-white/10 rounded-full overflow-hidden mb-4">
    <div 
      class="absolute left-0 top-0 h-full bg-[#42C1C8] rounded-full transition-all duration-300 ease-out"
      style="width: {$initialLoadingState.progress}%"
    />
  </div>

  <p class="text-semi-body text-Black dark:text-White">{getProgressMessage($initialLoadingState)}</p>
</div> 