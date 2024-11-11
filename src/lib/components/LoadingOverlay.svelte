<script lang="ts">
  import { loadingState } from '$lib/stores/loadingState';

  function getLoadingMessage($loadingState: any) {
    if ($loadingState.currentModule === 0) {
      return "Building course structure...";
    }
    if ($loadingState.currentModule <= $loadingState.totalModules) {
      return `Fetching videos for Module ${$loadingState.currentModule}`;
    }
    return "Generating your final course...";
  }

  function getDetailedLoadingMessage($loadingState: any) {
    if ($loadingState.currentModule === 0) {
      return "Our AI is crafting a personalized course outline for you. This may take a minute...";
    }
    if ($loadingState.currentModule <= $loadingState.totalModules) {
      return `Processing module ${$loadingState.currentModule} of ${$loadingState.totalModules}`;
    }
    return "Creating quizzes, refining content, and preparing your complete course. This may take a few minutes...";
  }
</script>

{#if $loadingState.isLoading}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-xl mb-2">{getLoadingMessage($loadingState)}</p>
      <p class="text-sm text-gray-600">{getDetailedLoadingMessage($loadingState)}</p>
    </div>
  </div>
{/if} 