<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { SearchFilter } from '$lib/types/search';

  export let show = false;
  export let onClose: () => void;
  export let currentFilter: SearchFilter = 'relevance';
  export let onFilterChange: (filter: SearchFilter) => void;

  let selectedFilter: SearchFilter = currentFilter;

  // Update selected filter when currentFilter prop changes
  $: {
    selectedFilter = currentFilter;
  }

  function handleFilter() {
    onFilterChange(selectedFilter);
    onClose();
  }

  function clearAll() {
    selectedFilter = 'relevance';
    onFilterChange('relevance');
    onClose();
  }

  function handleSortChange(filter: SearchFilter) {
    selectedFilter = filter;
  }
</script>

{#if show}
  <div 
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 bg-black/30 z-[101] flex items-start justify-center pt-20"
    on:click={onClose}
    on:keydown={(e) => {
      if (e.key === 'Escape') onClose();
    }}
    tabindex="-1"
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="bg-light-bg-primary dark:bg-dark-bg-primary rounded-2xl w-[300px] overflow-hidden"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border">
        <h2 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary">Add filter</h2>
        <button 
          on:click={onClose}
          class="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
        >
          <img src="/icons/cancel-square.svg" alt="Close" class="w-6 h-6 dark:invert" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
         <!-- Sort by -->
         <div class="flex gap-3 items-center mb-4">
          <h3 class="text-mini-body text-light-text-primary dark:text-dark-text-primary">Sort by:</h3>
          <div class="flex items-center gap-2">
            <button 
              class="px-2 py-1 rounded-lg {selectedFilter === 'relevance' ? 'border border-brand-red' : 'border border-light-border dark:border-dark-border'}"
              on:click={() => {
                selectedFilter = 'relevance';
              }}
            >
              <span class="{selectedFilter === 'relevance' ? 'text-brand-red' : 'text-light-text-tertiary dark:text-dark-text-tertiary'} text-mini-body">
                Relevance
              </span>
              {#if selectedFilter === 'relevance'}
                <img src="/icons/checkmark-square-active.svg" alt="Selected" class="w-4 h-4 inline-block ml-2" />
              {/if}
            </button>
          </div>
        </div>
        
        <!-- Sort by -->
        <div class="mb-4">
          <h3 class="text-mini-body uppercase text-light-text-tertiary dark:text-dark-text-tertiary mb-3">CREATION DATE</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={selectedFilter === 'latest'}
                on:change={() => handleSortChange('latest')}
                class="hidden"
              />
              <img 
                src={selectedFilter === 'latest' ? '/icons/checkmark-square-active.svg' : '/icons/checkmark-square-inactive.svg'} 
                alt="Checkbox"
                class="w-5 h-5 {selectedFilter !== 'latest' && 'dark:invert'}"
              />
              <span class="text-semi-body text-light-text-primary dark:text-dark-text-primary">Latest to Earliest</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={selectedFilter === 'earliest'}
                on:change={() => handleSortChange('earliest')}
                class="hidden"
              />
              <img 
                src={selectedFilter === 'earliest' ? '/icons/checkmark-square-active.svg' : '/icons/checkmark-square-inactive.svg'} 
                alt="Checkbox"
                class="w-5 h-5 {selectedFilter !== 'earliest' && 'dark:invert'}"
              />
              <span class="text-semi-body text-light-text-primary dark:text-dark-text-primary">Earliest to Latest</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-light-border dark:border-dark-border">
        <button 
          on:click={clearAll}
          class="text-semi-body text-brand-red hover:opacity-70 transition-opacity"
        >
          Clear all
        </button>
        <button 
          on:click={handleFilter}
          class="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors text-body"
        >
          Add filter
        </button>
      </div>
    </div>
  </div>
{/if} 