<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { onboarding } from '$lib/stores/onboarding';
  import { linear } from 'svelte/easing';

  let carouselInterval: NodeJS.Timeout;
  let previousSlide = 0;
  
  onMount(() => {
    // Auto-advance slides every 5 seconds
    carouselInterval = setInterval(() => {
      onboarding.nextSlide();
    }, 5000);
  });

  onDestroy(() => {
    if (carouselInterval) {
      clearInterval(carouselInterval);
    }
  });

  $: {
    // Update previous slide when current slide changes
    if ($onboarding.currentSlide !== previousSlide) {
      previousSlide = $onboarding.currentSlide;
    }
  }

  $: currentSlide = $onboarding.slides[$onboarding.currentSlide];
  $: slideHeight = $onboarding.currentSlide === 0 ? 'h-[750px]' :
                   $onboarding.currentSlide === 1 ? 'h-[755px]' :
                   $onboarding.currentSlide === 2 ? 'h-[702px]' : 'h-[745px]';

  function getTransition(index: number, isOut = false) {
    const duration = 300;
    const delay = 1600; // 1600ms delay for all slides as per Figma
    
    // First slide transitions
    if (index === 0) {
      return {
        x: isOut ? -500 : 0,
        y: 0,
        duration,
        delay,
        easing: linear
      };
    }
    
    // Second slide transitions
    if (index === 1) {
      return {
        x: isOut ? -500 : 500, // Push Left animation
        y: 0,
        duration,
        delay,
        easing: linear
      };
    }
    
    // Third slide transitions
    if (index === 2) {
      return {
        x: 0,
        y: isOut ? 500 : -500, // Push Top animation
        duration,
        delay,
        easing: linear
      };
    }
    
    // Fourth slide transitions (index 3)
    if (index === 3) {
      return {
        x: 0,
        y: isOut ? -500 : 500, // Push Bottom animation
        duration,
        delay,
        easing: linear
      };
    }

    // Default transition
    return {
      fade: true,
      duration,
      delay,
      easing: linear
    };
  }
</script>

<div class="w-full h-full flex flex-col items-center justify-center overflow-hidden">
  <div class="w-full max-w-[522px] flex flex-col items-center">
    {#key $onboarding.currentSlide}
      <div 
        class="flex-col justify-start items-center inline-flex w-full {slideHeight}"
        out:fly={getTransition(previousSlide, true)}
        in:fly={getTransition($onboarding.currentSlide)}
      >
        <!-- Text Content -->
        <div class="flex-col justify-start items-start gap-6 px-5 flex w-full">
          <!-- Title -->
          <div class="self-stretch break-words">
            {#each currentSlide.title.parts as part}
              <span class="text-h1 break-words {part.highlighted ? 'text-brand-red' : 'text-black dark:text-white'}">{part.text}</span>
            {/each}
          </div>

          <!-- Description -->
          <div class="self-stretch flex-col justify-start items-start gap-4 flex">
            <div class="self-stretch text-Black2 text-Body break-words">
              {currentSlide.description}
            </div>
          </div>
        </div>

        <!-- Image Container -->
        <div class="relative w-full flex justify-center">
          <img 
            src={currentSlide.image}
            alt="Onboarding Illustration"
            class="w-auto h-auto max-w-full max-h-[500px] object-contain"
          />
        </div>
      </div>
    {/key}
  </div>
</div> 