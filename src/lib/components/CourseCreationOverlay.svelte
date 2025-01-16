<script lang="ts">
  import { fade } from 'svelte/transition';
  export let show = false;
</script>

{#if show}
  <div 
    class="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-center justify-center"
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
  >
    <div class="relative">
      <img 
        src="/images/loading-spin.gif" 
        alt="Loading" 
        class="w-16 h-16"
      />
    </div>
  </div>
{/if} 