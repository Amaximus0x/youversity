<!-- src/lib/components/VideoLibraryCard.svelte -->
<script lang="ts">
  export let title: string = "Coding for Everyone: The Foundations of Web Development";
  export let description: string = "Start your programming journey by learning HTML, CSS, and JavaScript to build functional and interactive websites.";
  export let date: string = "10th May 2025";
  export let duration: string = "25 min";
  export let onClick: () => void = () => {};

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      onClick();
    }
  }
</script>

<div 
  class="w-full h-full backdrop-blur-sm rounded-[14px] border border-light-border dark:border-dark-border inline-flex flex-col justify-start items-start overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg"
  on:click={onClick}
  on:keydown={handleKeyDown}
  role="button"
  tabindex="0"
  aria-label="Video Library Card"
>
  <div class="relative w-full px-4 pt-4 pb-[92px] inline-flex justify-end items-start gap-2.5 overflow-hidden" style="background-image: url('/images/videoCardThumb.png'); background-size: cover; background-position: center;">
    <div class="absolute inset-0 bg-black/30"></div>
    <div class="p-2 bg-black/60 backdrop-blur-[2px] rounded-full flex justify-start items-center gap-2.5 z-10">
      <div class="w-6 h-6 relative overflow-hidden">
        <img src="/icons/DotsThreeOutlineVertical.svg" alt="Options" class="w-6 h-6" />
      </div>
    </div>
  </div>
  <div class="self-stretch p-4 flex flex-col justify-start items-start gap-6">
    <div class="self-stretch flex flex-col justify-start items-start gap-4">
      <div class="self-stretch flex flex-col justify-start items-start gap-2">
        <h3 class="self-stretch h-[55px] text-light-text-primary dark:text-dark-text-primary text-body-semibold line-clamp-2">{title}</h3>
        <p class="self-stretch text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body">{description}</p>
      </div>
      <div class="self-stretch inline-flex justify-between items-center">
        <div class="flex justify-start items-center gap-2">
          <div class="w-4 h-4 relative overflow-hidden">
            <img src="/icons/CalendarDots.svg" alt="Calendar" class="w-4 h-4" />
          </div>
          <div class="text-light-text-secondary dark:text-dark-text-secondary text-mini-body">{date}</div>
        </div>
        <div class="flex justify-start items-center gap-2">
          <div class="w-4 h-4 relative">
            <img src="/icons/time-quarter.svg" alt="Clock" class="w-4 h-4" />
          </div>
          <div class="text-light-text-secondary dark:text-dark-text-secondary text-mini-body">Duration: {duration}</div>
        </div>
      </div>
    </div>
  </div>
</div> 