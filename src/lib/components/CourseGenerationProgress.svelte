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
</script>

{#if mounted && $loadingState.isLoading}
  <div class={`fixed transition-all duration-300 ${$loadingState.minimized ? 'top-20 left-4 w-72 z-40' : 'inset-0 z-50'}`}>
    {#if $loadingState.minimized}
      <div class="bg-white rounded-lg shadow-lg p-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold truncate">{$loadingState.courseTitle}</h3>
          <button 
            on:click={toggleMinimize}
            class="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0"
            aria-label="Maximize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3h14v14H3V3zm2 2v10h10V5H5z"/>
            </svg>
          </button>
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
        <div class="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p class="text-xl mb-2">{$loadingState.currentStep}</p>
          <p class="text-sm text-gray-600 mb-4">
            {#if $loadingState.currentModule > 0}
              Processing module {$loadingState.currentModule} of {$loadingState.totalModules}
            {/if}
          </p>
          <button 
            on:click={toggleMinimize}
            class="mt-4 text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
            aria-label="Minimize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 6h8v8H6V6zm2 2v4h4V8H8z"/>
            </svg>
            Minimize
          </button>
        </div>
      </div>
    {/if}
  </div>
{:else if mounted && $loadingState.courseId}
  <div class="fixed top-4 left-4 z-40">
    <div 
      role="button"
      tabindex="0"
      on:click={handleComplete}
      on:keydown={(e) => e.key === 'Enter' && handleComplete()}
      class="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer hover:bg-green-600"
    >
      {$loadingState.courseTitle} built successfully! Click to view →
    </div>
  </div>
{/if} 