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
</script>

<div class="w-full h-full flex flex-col items-center justify-center overflow-hidden">
  <div class="w-full max-w-[522px] flex flex-col items-center px-4">
    {#key $onboarding.currentSlide}
      <div 
        class="w-full flex flex-col items-center"
        in:fade={{ duration: 300 }}
      >
        <div class="w-full max-w-[477px] flex flex-col items-start gap-6">
          <h2 class="font-poppins text-[32px] lg:text-[48px] leading-[1.4] lg:leading-[1.2] font-normal tracking-[-0.96px] text-left whitespace-pre-line">
            {#each currentSlide.title.parts as part}
              <span class={part.highlighted ? 'text-brand-red' : 'text-black'}>{part.text}</span>
            {/each}
          </h2>
          <p class="text-[#494848] font-poppins text-sm lg:text-base font-normal leading-6 tracking-[-0.16px]">
            {currentSlide.description}
          </p>
        </div>
        <div class="w-full relative flex items-center justify-center mt-16">
          <img 
            src={currentSlide.image}
            alt="Onboarding Illustration"
            class="w-full h-auto max-h-[400px] object-contain"
            in:fade={{ duration: 300 }}
          />
        </div>
      </div>
    {/key}
  </div>
</div> 