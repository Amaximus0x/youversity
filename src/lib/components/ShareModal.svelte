<script context="module" lang="ts">
  export {};
</script>

<script lang="ts">
  import { Copy, X, Mail, Facebook, Twitter, Instagram, Share2 } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import { browser } from '$app/environment';

  export let show = false;
  export let shareType: 'course' | 'profile' = 'course';
  export let id = ''; // This can be courseId or username
  export let courseId = '';
  export let onClose: () => void;
  export let courseName = ''; // Added to get the course name for sharing
  export let username = ''; // Added to get the username for profile sharing

  let copied = false;
  $: shareUrl = browser 
  ? `${window.location.origin}${shareType === 'course' ? `/course/${courseId}` : `/profile/${id}`}`
  : '';

  // Base domain for Youversity
  const baseUrl = browser ? window.location.origin : 'https://youversity.io';

  // Enhanced share text with more details
  $: courseShareText = `Hey, I just found this awesome course on Youversity${courseName ? `: '${courseName}'` : ''}. Check it out: ${shareUrl}\n\nYou can also create your own course for free on ${baseUrl}`;
  
  $: profileShareText = `Hey, check out this profile on Youversity${username ? ` for ${username}` : ''}. They've shared some great educational content: ${shareUrl}\n\nJoin Youversity today to create and share your own courses for free: ${baseUrl}`;

  $: shareText = shareType === 'course' ? courseShareText : profileShareText;
  
  // Shorter version for social media platforms with character limits
  $: shortShareText = shareType === 'course' 
    ? `Check out this course on Youversity${courseName ? `: ${courseName}` : ''}`
    : `Check out this profile on Youversity${username ? ` for ${username}` : ''}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareText);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function shareToSocial(platform: 'whatsapp' | 'facebook' | 'twitter' | 'email') {
    const text = shareText;
    const shortText = shortShareText;
    const encodedText = encodeURIComponent(text);
    const encodedShortText = encodeURIComponent(shortText);
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      facebook: `https://www.facebook.com/share.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodedShortText}`,
      email: `mailto:?subject=${encodeURIComponent(shortText)}&body=${encodedText}`
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
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
      class="bg-gradient-light dark:bg-gradient-dark rounded-lg p-6 max-w-md w-full mx-4 relative"
      on:click|stopPropagation
    >
      <button
        class="absolute top-2 right-2 p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-secondary rounded-full"
        on:click={onClose}
      >
        <X class="w-5 h-5 text-light-text-primary dark:text-dark-text-primary" />
      </button>

      <h2 class="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
        Share {shareType === 'course' ? 'Course' : 'Profile'}
      </h2>
      
      <div class="mb-4">
        <!-- <p class="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-2">Share message:</p> -->
        <div class="bg-light-bg-primary dark:bg-dark-bg-primary p-3 rounded-lg mb-2 max-h-32 overflow-y-auto">
          <p class="text-light-text-primary dark:text-dark-text-primary text-sm whitespace-pre-line">{shareText}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2 bg-light-bg-primary dark:bg-dark-bg-primary p-3 rounded-lg mb-4">
        <input
          type="text"
          readonly
          value={shareUrl}
          class="flex-1 bg-transparent outline-none text-light-text-primary dark:text-dark-text-primary"
        />
        <button
          class="p-2 hover:bg-light-bg-primary dark:hover:bg-dark-bg-tertiary rounded-full transition-colors"
          on:click={copyToClipboard}
          aria-label="Copy to clipboard"
        >
          <Copy class="w-5 h-5 text-Green dark:text-TransparentGreen2" />
        </button>
      </div>

      <div class="flex justify-center gap-4 mt-4">
        <button
          class="p-2 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded-full text-green-600"
          on:click={() => shareToSocial('whatsapp')}
          aria-label="Share on WhatsApp"
        >
          <Share2 class="w-5 h-5" />
        </button>
        
        <button
          class="p-2 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded-full text-blue-600"
          on:click={() => shareToSocial('facebook')}
          aria-label="Share on Facebook"
        >
          <Facebook class="w-5 h-5" />
        </button>
        
        <button
          class="p-2 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded-full text-light-text-primary dark:text-dark-text-primary"
          on:click={() => shareToSocial('twitter')}
          aria-label="Share on Twitter"
        >
          <Twitter class="w-5 h-5" />
        </button>
        
        <button
          class="p-2 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded-full text-light-text-tertiary dark:text-dark-text-tertiary"
          on:click={() => shareToSocial('email')}
          aria-label="Share via Email"
        >
          <Mail class="w-5 h-5" />
        </button>
      </div>

      {#if copied}
        <p class="text-green-500 text-sm mt-2 text-center">Message copied to clipboard!</p>
      {/if}
    </div>
  </div>
{/if}
