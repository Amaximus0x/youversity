<script lang="ts">
  import { loadingState } from '$lib/stores/loadingState';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let mounted = false;

  onMount(() => {
    mounted = true;
    return () => {
      mounted = false;
    };
  });

  function handleComplete() {
    if ($loadingState.courseId) {
      goto(`/course/${$loadingState.courseId}`);
      loadingState.clearState();
    }
  }

  function toggleMinimize() {
    loadingState.setMinimized(!$loadingState.minimized);
  }

  function handleClose() {
    loadingState.clearState();
  }

  function getProgressMessage(state: any) {
    if (state.currentStep) {
      return state.currentStep;
    }
    
    if (state.isInitialBuild) {
      if (state.currentModule === 0) {
        return "Analyzing your course objective...";
      }
      return `Generating module ${state.currentModule} of ${state.totalModules}`;
    } else {
      if (state.currentModule === 0) {
        return "Preparing course refinement...";
      }
      return `Processing module ${state.currentModule} of ${state.totalModules}`;
    }
  }
</script>

{#if mounted && $loadingState.isLoading}
  <div class={`fixed transition-all duration-300 ease-in-out ${
    $loadingState.minimized 
      ? 'bottom-4 left-4 w-72 z-40 hover:scale-102 transform' 
      : 'inset-0 z-50'
  }`}>
    {#if $loadingState.minimized}
      <div class="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow duration-200">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold truncate">{$loadingState.courseTitle || 'Generating Course'}</h3>
          <div class="flex gap-2">
            {#if $loadingState.error}
              <button 
                on:click={handleClose}
                class="text-red-500 hover:text-red-700 transition-colors duration-200"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            {/if}
            <button 
              on:click={toggleMinimize}
              class="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Maximize"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 8V4a1 1 0 011-1h4a1 1 0 110 2H5v3a1 1 0 01-2 0zm14 0V4a1 1 0 00-1-1h-4a1 1 0 110-2h4a2 2 0 012 2v4a1 1 0 11-2 0zm-7 4a1 1 0 011 1v3h3a1 1 0 110 2h-4a1 1 0 01-1-1v-4a1 1 0 011-1zm-7 0a1 1 0 00-1 1v3H5a1 1 0 100 2h4a1 1 0 001-1v-4a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        <div class="bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
          <div 
            class="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
            style="width: {$loadingState.progress}%"
          />
        </div>
        <p class="text-sm text-gray-600">{getProgressMessage($loadingState)}</p>
      </div>
    {:else}
      <div class="bg-black bg-opacity-50 flex items-center justify-center h-full backdrop-blur-sm">
        <div class="bg-white p-8 rounded-lg shadow-lg text-center max-w-md relative">
          <button 
            on:click={toggleMinimize}
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
            aria-label="Minimize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p class="text-xl mb-2">{getProgressMessage($loadingState)}</p>
          {#if $loadingState.currentModule > 0}
            <p class="text-sm text-gray-600">
              Processing module {$loadingState.currentModule} of {$loadingState.totalModules}
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if} 