<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { onboarding } from '$lib/stores/onboarding';
  import { linear } from 'svelte/easing';
  import { writable } from 'svelte/store';

  const isDarkMode = writable(false);

  let carouselInterval: NodeJS.Timeout;
  let previousSlide = 0;
  
  onMount(() => {
    // Check initial theme
    isDarkMode.set(document.documentElement.classList.contains('dark'));

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          isDarkMode.set(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Auto-advance slides every 5 seconds
    carouselInterval = setInterval(() => {
      onboarding.nextSlide();
    }, 2000);

    return () => {
      observer.disconnect();
    };
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
  $: slideHeight = $onboarding.currentSlide === 0 ? 'min-h-[400px] h-full max-h-[750px]' :
                   $onboarding.currentSlide === 1 ? 'min-h-[400px] h-full max-h-[755px]' :
                   $onboarding.currentSlide === 2 ? 'min-h-[400px] h-full max-h-[702px]' : 
                   'min-h-[500px] h-full max-h-[745px]';

  function getTransition(index: number, isOut = false) {
    const duration = 300;
    const delay = 1600;

    const transitions = {
      0: { // First slide
        in: { opacity: 0, x: 0, y: 0 },
        out: { x: -900, y: 0 }
      },
      1: { // Second slide
        in: { x: 900, y: 0 },
        out: { x: -900, y: 0 }
      },
      2: { // Third slide
        in: { x: -900, y: 0 },
        out: { x: 900, y: 0 }
      },
      3: { // Fourth slide
        in: { y: -900, x: 0 },
        out: { opacity: 0, x: 0, y: 0 }
      }
    } as const;

    const transition = transitions[index]?.[isOut ? 'out' : 'in'] || { opacity: 0 };

    return {
      ...transition,
      duration,
      delay,
      easing: linear
    };
  }
</script>

<div class="w-full h-full flex flex-col items-center justify-center overflow-hidden relative">
  <div class="w-full max-w-[522px] flex flex-col items-center h-[90vh] max-h-[755px] relative">
    {#key $onboarding.currentSlide}
      <div 
        class="flex-col justify-start items-center inline-flex w-full absolute top-0 left-0 right-0 {slideHeight}"
        out:fly|local={getTransition(previousSlide, true)}
        in:fly|local={getTransition($onboarding.currentSlide)}
      >
        <!-- Text Content -->
        <div class="flex-col justify-start items-start gap-3 sm:gap-6 px-3 sm:px-5 flex w-full">
          <!-- Title -->
          <div class="self-stretch break-words">
            {#each currentSlide.title.parts as part}
              <span class="text-2xl sm:text-h1 break-words {part.highlighted ? 'text-brand-red' : 'text-black dark:text-white'}">{part.text}</span>
            {/each}
          </div>

          <!-- Description -->
          <div class="self-stretch flex-col justify-start items-start gap-2 sm:gap-4 flex">
            <div class="self-stretch text-light-text-secondary dark:text-dark-text-secondary text-sm sm:text-Body break-words">
              {currentSlide.description}
            </div>
          </div>
        </div>

        <!-- Image Container -->
        <div class="relative w-full flex justify-center mt-4">
          <img 
            src={currentSlide.imageDark && $isDarkMode ? currentSlide.imageDark : currentSlide.image}
            alt="Onboarding Illustration"
            class="w-auto h-auto max-w-full max-h-[40vh] sm:max-h-[430px] object-contain"
          />
        </div>
      </div>
    {/key}
  </div>
</div> 