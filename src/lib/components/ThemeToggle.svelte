<!-- ThemeToggle.svelte -->
<script lang="ts">
  import { theme } from '$lib/stores/theme';
  
  function toggleTheme() {
    theme.update(current => current === 'light' ? 'dark' : 'light');
  }
</script>

<button
  on:click={toggleTheme}
  class="p-2 rounded-full hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
  aria-label="Toggle theme"
>
  {#if $theme === 'light'}
    <img src="/icons/moon.svg" alt="Dark mode" class="w-5 h-5" />
  {:else}
    <img src="/icons/sun.svg" alt="Light mode" class="w-5 h-5" />
  {/if}
</button> 