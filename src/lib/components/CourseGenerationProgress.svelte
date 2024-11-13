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
</script>

{#if mounted && $loadingState.isLoading}
  <div class={`fixed transition-all duration-300 ${$loadingState.minimized ? 'bottom-4 right-4 w-72 z-40' : 'inset-0 z-50'}`}>
    {#if $loadingState.minimized}
      <div class="bg-white rounded-lg shadow-lg p-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold truncate">{$loadingState.courseTitle}</h3>
          <div class="flex gap-2">
            {#if $loadingState.error}
              <button 
                on:click={handleClose}
                class="text-red-500 hover:text-red-700"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            {/if}
            {#if !$loadingState.isInitialBuild}
              <button 
                on:click={toggleMinimize}
                class="text-gray-500 hover:text-gray-700"
                aria-label="Maximize"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 11-2 0V4H5v12h10v-1a1 1 0 112 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" clip-rule="evenodd" />
                </svg>
              </button>
            {/if}
          </div>
        </div>
        <div class="bg-gray-200 rounded-full h-2 mb-2">
          <div 
            class="bg-blue-600 h-full rounded-full transition-all duration-300"
            style="width: {$loadingState.progress}%"
          />
        </div>
        <p class="text-sm text-gray-600">{$loadingState.currentStep}</p>
      </div>
    {:else}
      <div class="bg-black bg-opacity-50 flex items-center justify-center h-full">
        <div class="bg-white p-8 rounded-lg shadow-lg text-center max-w-md relative">
          <div class="absolute top-2 right-2 flex gap-2">
            {#if $loadingState.error}
              <button 
                on:click={handleClose}
                class="w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            {/if}
            {#if !$loadingState.isInitialBuild}
              <button 
                on:click={toggleMinimize}
                class="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors duration-200"
                aria-label="Minimize"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            {/if}
          </div>

          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p class="text-xl mb-2">{$loadingState.currentStep}</p>
          <p class="text-sm text-gray-600 mb-4">
            {#if $loadingState.currentModule > 0}
              Processing module {$loadingState.currentModule} of {$loadingState.totalModules}
            {/if}
          </p>
        </div>
      </div>
    {/if}
  </div>
{:else if mounted && $loadingState.courseId}
  <div class="fixed bottom-4 right-4 z-40">
    <div 
      class="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg relative group"
    >
      <button
        on:click={handleClose}
        class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <div 
        role="button"
        tabindex="0"
        on:click={handleComplete}
        on:keydown={(e) => e.key === 'Enter' && handleComplete()}
        class="cursor-pointer hover:text-white/90"
      >
        {$loadingState.courseTitle} course is built successfully! Click to view →
      </div>
    </div>
  </div>
{/if} 