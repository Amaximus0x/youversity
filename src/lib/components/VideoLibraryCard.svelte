<!-- src/lib/components/VideoLibraryCard.svelte -->
<script lang="ts">
  export let title: string = "Coding for Everyone: The Foundations of Web Development";
  export let description: string = "Start your programming journey by learning HTML, CSS, and JavaScript to build functional and interactive websites.";
  export let date: string = "10th May 2025";
  export let duration: string = "25 min";
  export let onClick: () => void = () => {};
  export let onOptionsClick: (event: MouseEvent) => void = () => {};
  export let selectable: boolean = false;
  export let selected: boolean = false;
  export let onSelect: (selected: boolean) => void = () => {};

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      onClick();
    }
  }

  function handleOptionsClick(event: MouseEvent) {
    event.stopPropagation();
    onOptionsClick(event);
  }

  function handleOptionsKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
      onOptionsClick(event as any);
    }
  }

  function handleSelectClick(event: MouseEvent) {
    event.stopPropagation();
    onSelect(!selected);
  }

  function handleSelectKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
      onSelect(!selected);
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
    
    <!-- Options Button or Selection Checkbox -->
    <div 
      class="p-2 bg-black/60 backdrop-blur-[2px] rounded-md flex justify-center items-center z-10" 
      on:click={selectable ? handleSelectClick : handleOptionsClick}
      on:keydown={selectable ? handleSelectKeyDown : handleOptionsKeyDown}
      role={selectable ? "checkbox" : "button"}
      aria-checked={selectable ? selected : undefined}
      aria-label={selectable ? "Select video" : "Options"}
    >
      {#if selectable}
        <!-- Selection Checkbox -->
        {#if selected}
          <img src="/icons/checkmark-square-active.svg" alt="Selected" class="w-5 h-5" />
        {:else}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.66699 8.00033C1.66699 5.01477 1.66699 3.52199 2.59449 2.59449C3.52199 1.66699 5.01477 1.66699 8.00033 1.66699C10.9859 1.66699 12.4787 1.66699 13.4062 2.59449C14.3337 3.52199 14.3337 5.01477 14.3337 8.00033C14.3337 10.9859 14.3337 12.4787 13.4062 13.4062C12.4787 14.3337 10.9859 14.3337 8.00033 14.3337C5.01477 14.3337 3.52199 14.3337 2.59449 13.4062C1.66699 12.4787 1.66699 10.9859 1.66699 8.00033Z" stroke="white" stroke-width="1.5"/>
          </svg>
        {/if}
      {:else}
        <!-- Options Button -->
        <div class="w-5 h-5 relative overflow-hidden flex justify-center items-center">
          <img src="/icons/DotsThreeOutlineVertical.svg" alt="Options" class="w-5 h-5" />
        </div>
      {/if}
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