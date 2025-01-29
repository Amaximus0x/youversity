<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { onboarding } from '$lib/stores/onboarding';

  let carouselInterval: NodeJS.Timeout;
  
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

  $: currentSlide = $onboarding.slides[$onboarding.currentSlide];
  $: slideHeight = $onboarding.currentSlide === 0 ? 'h-[750px]' :
                   $onboarding.currentSlide === 1 ? 'h-[755px]' :
                   $onboarding.currentSlide === 2 ? 'h-[702px]' : 'h-[745px]';
  
</script>

<div class="w-full h-full flex flex-col items-center justify-center overflow-hidden">
  <div class="w-full max-w-[522px] flex flex-col items-center ">
    {#key $onboarding.currentSlide}
      <div 
        class="flex-col justify-start items-center inline-flex w-full  {slideHeight}"
        in:fade={{ duration: 300 }}
      >
        <!-- Text Content -->
        <div class="flex-col justify-start items-start gap-6 px-5 flex w-full ">
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
            in:fade={{ duration: 300 }}
          />
        </div>
      </div>
    {/key}
  </div>
</div> 