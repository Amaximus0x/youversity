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
      <div class="flex items-center justify-between px-6 py-4 border-b border-Black/5">
        <h2 class="text-h4-medium text-black dark:text-white">Add filter</h2>
        <button 
          on:click={onClose}
          class="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
        >
          <img src="/icons/cancel-square.svg" alt="Close" class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
         <!-- Sort by -->
         <div class="flex gap-3 items-center mb-4">
          <h3 class="text-mini-body">Sort by:</h3>
          <div class="flex items-center gap-2">
            <button 
              class="px-2 py-1 rounded-lg {selectedFilter === 'relevance' ? ' border border-brand-red' : 'border border-[#E5E7EB]'}"
              on:click={() => {
                selectedFilter = 'relevance';
              }}
            >
              <span class="{(selectedFilter === 'latest' || selectedFilter === 'earliest') ? 'text-Black dark:text-White' : 'text-[#6B7280]'} text-mini-body">
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
          <h3 class="text-mini-body uppercase text-Grey mb-3">CREATION DATE</h3>
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
                class="w-5 h-5"
              />
              <span class="text-semi-body">Latest to Earliest</span>
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
                class="w-5 h-5"
              />
              <span class="text-semi-body">Earliest to Latest</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-6 py-4">
        <button 
          on:click={clearAll}
          class="text-semi-body text-brand-red hover:opacity-70 transition-opacity"
        >
          Clear all
        </button>
        <button 
          on:click={handleFilter}
          class="px-6 py-2 bg-brand-red text-white rounded-lg hover:opacity-70 transition-opacity text-body"
        >
          Add filter
        </button>
      </div>
    </div>
  </div>
{/if} 