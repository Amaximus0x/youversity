<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { SearchFilter } from '$lib/services/search';

  export let show = false;
  export let onClose: () => void;
  export let currentFilter: SearchFilter = 'relevance';
  export let onFilterChange: (filters: { ratings: number[], sortByLatest: boolean }) => void;

  let sortOrder: 'relevance' = 'relevance';
  let latestFirst = false;
  let earliestFirst = false;

  function handleFilter() {
    onFilterChange({
      ratings: [],
      sortByLatest: latestFirst
    });
    onClose();
  }

  function clearAll() {
    latestFirst = false;
    earliestFirst = false;
    onFilterChange({
      ratings: [],
      sortByLatest: false
    });
    onClose();
  }

  function handleSortChange(type: 'latest' | 'earliest') {
    if (type === 'latest') {
      latestFirst = !latestFirst;
      if (latestFirst) earliestFirst = false;
    } else {
      earliestFirst = !earliestFirst;
      if (earliestFirst) latestFirst = false;
    }
  }
</script>

{#if show}
  <div 
    class="fixed inset-0 bg-black/30 z-[101] flex items-start justify-center pt-20"
    on:click={onClose}
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
              class="px-2 py-1 rounded-lg {!latestFirst && !earliestFirst ? ' border border-brand-red' : 'border border-[#E5E7EB]'}"
              on:click={() => {
                latestFirst = false;
                earliestFirst = false;
              }}
            >
              <span class="{!latestFirst && !earliestFirst ? 'text-Black dark:text-White' : 'text-[#6B7280]'} text-mini-body">
                Relevance
              </span>
              {#if !latestFirst && !earliestFirst}
                <img src="/icons/checkmark-square-active.svg" alt="Selected" class="w-4 h-4 inline-block ml-2" />
              {/if}
            </button>
          </div>
        </div>

        <!-- Creation Date -->
        <div class="mb-4">
          <h3 class="text-mini-body uppercase text-Grey mb-3">CREATION DATE</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={latestFirst}
                on:change={() => handleSortChange('latest')}
                class="hidden"
              />
              <img 
                src={latestFirst ? '/icons/checkmark-square-active.svg' : '/icons/checkmark-square-inactive.svg'} 
                alt="Checkbox"
                class="w-5 h-5"
              />
              <span class="text-semi-body">Latest to Earliest</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={earliestFirst}
                on:change={() => handleSortChange('earliest')}
                class="hidden"
              />
              <img 
                src={earliestFirst ? '/icons/checkmark-square-active.svg' : '/icons/checkmark-square-inactive.svg'} 
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