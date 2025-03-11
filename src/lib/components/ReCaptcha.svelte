<script lang="ts">
  import { onMount } from 'svelte';
  import { recaptchaToken } from '$lib/stores/recaptcha';

  export let siteKey: string;
  let captchaElement: HTMLDivElement;

  onMount(() => {
    // Define global callbacks
    window.onRecaptchaSuccess = (token: string) => {
      if (typeof token === 'string') {
        recaptchaToken.set(token);
      }
    };
    
    window.onRecaptchaExpired = () => {
      recaptchaToken.set(null);
    };

    return () => {
      // Cleanup
      delete window.onRecaptchaSuccess;
      delete window.onRecaptchaExpired;
    };
  });
</script>

<div class="recaptcha-container">
  <div 
    bind:this={captchaElement} 
    class="g-recaptcha" 
    data-sitekey={siteKey}
    data-callback="onRecaptchaSuccess"
    data-expired-callback="onRecaptchaExpired"
  ></div>
</div>

<style>
  .recaptcha-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 78px;
  }
</style> 