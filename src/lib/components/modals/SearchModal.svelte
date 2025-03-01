<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  
  // Props
  export let show = false;
  export let initialQuery = '';
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    close: void;
    search: { query: string };
  }>();
  
  // Local state
  let searchQuery = initialQuery;
  
  // Handle search submission
  function handleSubmit() {
    if (searchQuery.trim()) {
      dispatch('search', { query: searchQuery.trim() });
      close();
    }
  }
  
  // Close the modal
  function close() {
    dispatch('close');
  }
  
  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

{#if show}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    transition:fade={{ duration: 200 }}
    on:keydown={handleKeydown}
  >
    <div 
      class="w-full max-w-lg bg-white dark:bg-dark-bg-primary rounded-2xl shadow-lg overflow-hidden"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="p-4 flex items-center justify-between border-b border-light-border dark:border-dark-border">
        <h2 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary">Search</h2>
        <button 
          class="p-2 text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
          on:click={close}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <!-- Search form -->
      <div class="p-4">
        <form on:submit|preventDefault={handleSubmit}>
          <div class="relative">
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search for courses, topics, or users..."
              class="w-full px-4 py-3 pl-10 bg-white dark:bg-dark-bg-primary border-2 border-light-border dark:border-dark-border rounded-2xl text-body text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-brand-navy dark:focus:border-brand-turquoise"
              autofocus
            />
            <svg 
              class="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text-tertiary dark:text-dark-text-tertiary" 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 text-semibody-medium text-light-text-primary dark:text-dark-text-primary bg-Black/5 dark:bg-dark-bg-secondary rounded-lg"
              on:click={close}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-semibody-medium text-white bg-brand-navy hover:bg-GreenHover dark:bg-brand-turquoise dark:hover:bg-brand-navy transition-colors rounded-lg"
              disabled={!searchQuery.trim()}
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if} 