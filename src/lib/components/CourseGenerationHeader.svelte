<script lang="ts">
  import { loadingState } from '$lib/stores/loadingState';
  import { fade } from 'svelte/transition';

  function getProgressMessage($loadingState: any) {
    if ($loadingState.progress === 100) {
      return "Course modules are ready.";
    }
    if ($loadingState.currentStep) {
      return $loadingState.currentStep;
    }
    if ($loadingState.currentModule > 0) {
      return `Compiling Module ${$loadingState.currentModule} videos`;
    }
    return "Analyzing your course objective...";
  }

  $: isComplete = $loadingState.progress === 100;
</script>

<div 
  class="w-[746px] h-auto rounded-2xl shadow-sm border border-[rgba(0,0,0,0.05)] p-6 mb-8"
  in:fade={{ duration: 200 }}
>
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="text-2xl font-medium text-[#2A4D61]">
        Generating Course
      </h2>
    </div>
    {#if isComplete}
      <img 
        src="/images/checkmark-circle.svg" 
        alt="Success" 
        class="w-8 h-8"
      />
    {:else}
      <img 
        src="/images/loading-spin.gif" 
        alt="Loading" 
        class="w-8 h-8"
      />
    {/if}
  </div>
  
  <div class="relative h-2 bg-[#F5F5F5] rounded-full overflow-hidden mb-4">
    <div 
      class="absolute left-0 top-0 h-full bg-[#42C1C8] rounded-full transition-all duration-300 ease-out"
      style="width: {$loadingState.progress}%"
    />
  </div>

  <p class="text-[#2A4D61]">{getProgressMessage($loadingState)}</p>
</div> 