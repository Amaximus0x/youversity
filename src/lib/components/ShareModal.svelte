<script lang="ts">
  import { Copy, X, Mail, Facebook, Twitter, Instagram, Share2 } from 'lucide-svelte';
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

  function shareToSocial(platform: string) {
    const text = `Check out this course: ${shareUrl}`;
    const encodedText = encodeURIComponent(text);
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      facebook: `https://www.facebook.com/share.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out this course:')}`,
      email: `mailto:?subject=${encodeURIComponent('Check out this course')}&body=${encodedText}`
    };

  //   if (platform === 'facebook') {
  //   // Open Facebook in a new tab without size constraints
  //   window.open(urls[platform], '_blank');
  // } else {
    // Keep popup behavior for other platforms
    window.open(urls[platform], '_blank', 'width=600,height=400');
  // }
  }
</script>

{#if show}
  <div 
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    transition:fade
    on:click={onClose}
  >
    <div 
      role="document"
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
      
      <div class="flex items-center gap-2 bg-gray-50 p-3 rounded-lg mb-4">
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

      <div class="flex justify-center gap-4 mt-4">
        <button
          class="p-2 hover:bg-gray-100 rounded-full text-green-600"
          on:click={() => shareToSocial('whatsapp')}
        >
          <Share2 class="w-5 h-5" />
        </button>
        
        <button
          class="p-2 hover:bg-gray-100 rounded-full text-blue-600"
          on:click={() => shareToSocial('facebook')}
        >
          <Facebook class="w-5 h-5" />
        </button>
        
        <button
          class="p-2 hover:bg-gray-100 rounded-full text-black"
          on:click={() => shareToSocial('twitter')}
        >
          <Twitter class="w-5 h-5" />
        </button>
        
        <button
          class="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          on:click={() => shareToSocial('email')}
        >
          <Mail class="w-5 h-5" />
        </button>
      </div>

      {#if copied}
        <p class="text-green-500 text-sm mt-2">Link copied to clipboard!</p>
      {/if}
    </div>
  </div>
{/if}
