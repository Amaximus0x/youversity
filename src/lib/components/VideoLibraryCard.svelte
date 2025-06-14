<!-- src/lib/components/VideoLibraryCard.svelte -->
<script lang="ts">
  export let title: string = '';
  export let description: string = '';
  export let date: string = '';
  export let duration: string = '';
  export let thumbnailUrl: string = '';
  export let onClick: () => void = () => {};
  export let onOptionsClick: (event: MouseEvent) => void = () => {};
  export let selectable: boolean = false;
  export let selected: boolean = false;
  export let onSelect: (selected: boolean) => void = () => {};

  function handleSelectClick(event: MouseEvent) {
    event.stopPropagation();
    onSelect(!selected);
  }

  function handleOptionsClick(event: MouseEvent) {
    event.stopPropagation();
    onOptionsClick(event);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    
    // Add ordinal suffix to day
    const ordinal = (day: number): string => {
      if (day > 3 && day < 21) return day + 'th';
      switch (day % 10) {
        case 1: return day + 'st';
        case 2: return day + 'nd';
        case 3: return day + 'rd';
        default: return day + 'th';
      }
    };

    return `${ordinal(day)} ${month} ${year}`;
  }
</script>

<div 
  class="w-full h-full backdrop-blur-sm rounded-[14px] border border-light-border dark:border-dark-border inline-flex flex-col justify-start items-start overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg"
  on:click={onClick}
>
  <div class="relative w-full px-4 pt-4 pb-[92px] inline-flex justify-end items-start gap-2.5 overflow-hidden" style="background-image: url('{thumbnailUrl || '/images/videoCardThumb.png'}'); background-size: cover; background-position: center;">
    <div class="absolute inset-0 bg-black/30"></div>
    
    <!-- Options Button or Selection Checkbox -->
    <div 
      class="p-2 bg-black/60 backdrop-blur-[2px] rounded-full flex justify-center items-center z-10" 
      on:click={selectable ? handleSelectClick : handleOptionsClick}
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
        <svg class="w-5 h-5 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.625 12C14.625 12.5192 14.471 13.0267 14.1826 13.4584C13.8942 13.8901 13.4842 14.2265 13.0045 14.4252C12.5249 14.6239 11.9971 14.6758 11.4879 14.5746C10.9787 14.4733 10.511 14.2233 10.1438 13.8562C9.77673 13.489 9.52673 13.0213 9.42544 12.5121C9.32415 12.0029 9.37614 11.4751 9.57482 10.9955C9.7735 10.5158 10.11 10.1058 10.5416 9.81739C10.9733 9.52896 11.4808 9.375 12 9.375C12.6962 9.375 13.3639 9.65156 13.8562 10.1438C14.3484 10.6361 14.625 11.3038 14.625 12ZM12 7.125C12.5192 7.125 13.0267 6.97105 13.4584 6.68261C13.8901 6.39417 14.2265 5.9842 14.4252 5.50455C14.6239 5.02489 14.6758 4.49709 14.5746 3.98789C14.4733 3.47869 14.2233 3.01096 13.8562 2.64385C13.489 2.27673 13.0213 2.02673 12.5121 1.92544C12.0029 1.82415 11.4751 1.87614 10.9955 2.07482C10.5158 2.2735 10.1058 2.60995 9.81739 3.04163C9.52895 3.47331 9.375 3.98083 9.375 4.5C9.375 5.19619 9.65156 5.86387 10.1438 6.35616C10.6361 6.84844 11.3038 7.125 12 7.125ZM12 16.875C11.4808 16.875 10.9733 17.029 10.5416 17.3174C10.11 17.6058 9.7735 18.0158 9.57482 18.4955C9.37614 18.9751 9.32415 19.5029 9.42544 20.0121C9.52673 20.5213 9.77673 20.989 10.1438 21.3562C10.511 21.7233 10.9787 21.9733 11.4879 22.0746C11.9971 22.1758 12.5249 22.1239 13.0045 21.9252C13.4842 21.7265 13.8942 21.3901 14.1826 20.9584C14.471 20.5267 14.625 20.0192 14.625 19.5C14.625 18.8038 14.3484 18.1361 13.8562 17.6438C13.3639 17.1516 12.6962 16.875 12 16.875Z"/>
        </svg>
      {/if}
    </div>
  </div>
  <div class="self-stretch p-4 flex flex-col justify-start items-start gap-6">
    <div class="self-stretch flex flex-col justify-start items-start gap-4">
      <div class="self-stretch flex flex-col justify-start items-start gap-2">
        <h3 class="self-stretch h-[55px] text-light-text-primary dark:text-dark-text-primary text-body-semibold line-clamp-2">{title}</h3>
        <p class="self-stretch text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body line-clamp-2">{description}</p>
      </div>
      <div class="self-stretch inline-flex justify-between items-center">
        <div class="flex justify-start items-center gap-2">
          <div class="w-4 h-4 relative overflow-hidden">
            <img src="/icons/CalendarDots.svg" alt="Calendar" class="w-4 h-4" />
          </div>
          <div class="text-light-text-secondary dark:text-dark-text-secondary text-mini-body">{formatDate(date)}</div>
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