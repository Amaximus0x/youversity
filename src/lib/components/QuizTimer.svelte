<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let timeSpent = 0;
  let interval: NodeJS.Timer;

  onMount(() => {
    interval = setInterval(() => {
      timeSpent++;
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
</script>

<span class="text-semi-body text-Black2">Time: {formatTime(timeSpent)}</span>
