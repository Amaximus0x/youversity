<script lang="ts">
  import { Copy, X } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import { browser } from '$app/environment';

  export let show = false;
  export let courseId: string;
  export let onClose: () => void;

  let copied = false;
  $: shareUrl = browser ? `${window.location.origin}/course/${courseId}` : '';

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

{#if show}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    transition:fade
    on:click={onClose}
  >
    <div 
      class="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative"
      on:click|stopPropagation
    >
      <button
        class="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full"
        on:click={onClose}
      >
        <X class="w-5 h-5" />
      </button>

      <h2 class="text-xl font-semibold mb-4 text-[#2A4D61]">Share Course</h2>
      
      <div class="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
        <input
          type="text"
          readonly
          value={shareUrl}
          class="flex-1 bg-transparent outline-none text-gray-700"
        />
        <button
          class="p-2 hover:bg-gray-200 rounded-full transition-colors"
          on:click={copyToClipboard}
        >
          <Copy class="w-5 h-5 text-[#2A4D61]" />
        </button>
      </div>

      {#if copied}
        <p class="text-green-500 text-sm mt-2">Link copied to clipboard!</p>
      {/if}
    </div>
  </div>
{/if}
