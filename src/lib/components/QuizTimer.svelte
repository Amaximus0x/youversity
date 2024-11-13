<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  const QUIZ_TIME = 5 * 60; // 5 minutes in seconds
  
  let timeRemaining = QUIZ_TIME;
  let timer: NodeJS.Timer;

  onMount(() => {
    timer = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        clearInterval(timer);
        dispatch('timeUp');
      }
    }, 1000);
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  $: minutes = Math.floor(timeRemaining / 60);
  $: seconds = timeRemaining % 60;
</script>

<div class="text-center text-xl font-semibold {timeRemaining <= 30 ? 'text-red-600' : 'text-gray-700'}">
  Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}
</div>
