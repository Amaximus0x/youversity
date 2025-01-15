# New File
<script lang="ts">
  import { loadingState } from '$lib/stores/loadingState';
  import { fade } from 'svelte/transition';

  function getProgressMessage($loadingState: any) {
    if ($loadingState.currentStep) {
      return $loadingState.currentStep;
    }
    
    if ($loadingState.currentModule === 0) {
      return "Generating Course";
    }
    
    return `Compiling Module ${$loadingState.currentModule} videos`;
  }
</script>

{#if $loadingState.isLoading}
  <div 
    class="bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.05)] p-6 mb-8"
    in:fade={{ duration: 200 }}
  >
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-medium text-[#2A4D61]">
          {getProgressMessage($loadingState)}
        </h2>
        {#if $loadingState.currentModule > 0}
          <p class="text-[#5F6368] mt-1">
            {$loadingState.currentModuleTitle}
          </p>
        {/if}
      </div>
      <img 
        src="/favicon.png" 
        alt="Logo" 
        class="w-8 h-8 animate-pulse"
      />
    </div>
    
    <div class="relative h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
      <div 
        class="absolute left-0 top-0 h-full bg-[#42C1C8] rounded-full transition-all duration-300 ease-out"
        style="width: {$loadingState.progress}%"
      />
    </div>
  </div>
{/if} 