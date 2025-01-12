<script lang="ts">
  import { fade } from 'svelte/transition';

  export let show = false;
  export let onClose: () => void;

  let selectedRatings: number[] = [];
  let sortByLatest = false;

  function handleFilter() {
    // TODO: Implement filter logic
    onClose();
  }

  function clearAll() {
    selectedRatings = [];
    sortByLatest = false;
  }
</script>

{#if show}
  <div 
    class="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-20"
    on:click={onClose}
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="bg-white rounded-2xl w-[300px] overflow-hidden"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.05)]">
        <h2 class="text-base font-medium">Add filter</h2>
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
        <div class="mb-6">
          <div class="flex items-center gap-2">
            <span class="text-base">Sort by:</span>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#EE434A] rounded-lg">
              <span class="text-[#EE434A] text-base">Relevance</span>
              <img src="/icons/checkmark-square-active.svg" alt="Selected" class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Ratings -->
        <div class="mb-6">
          <h3 class="text-xs font-medium uppercase text-[#5F6368] mb-3">RATINGS</h3>
          <div class="space-y-3">
            {#each [5, 4, 3, 2, 1] as rating}
              <label class="flex items-center gap-3 cursor-pointer">
                <img 
                  src={selectedRatings.includes(rating) ? '/icons/checkmark-square-active.svg' : '/icons/checkmark-square-inactive.svg'} 
                  alt="Checkbox"
                  class="w-5 h-5"
                />
                <div class="flex items-center gap-1">
                  {#each Array(5) as _, i}
                    <img 
                      src="/icons/star.svg"
                      alt="star"
                      class="w-4 h-4"
                      style={i >= rating ? 'opacity: 0.2;' : ''}
                    />
                  {/each}
                  <span class="text-base text-black ml-1">{rating}.0</span>
                </div>
                <input 
                  type="checkbox"
                  class="hidden"
                  bind:group={selectedRatings}
                  value={rating}
                />
              </label>
            {/each}
          </div>
        </div>

        <!-- Creation Date -->
        <div>
          <h3 class="text-xs font-medium uppercase text-[#5F6368] mb-3">CREATION DATE</h3>
          <label class="flex items-center gap-3 cursor-pointer">
            <img 
              src={sortByLatest ? '/icons/checkmark-square-active.svg' : '/icons/checkmark-square-inactive.svg'} 
              alt="Checkbox"
              class="w-5 h-5"
            />
            <span class="text-base">Least to Earliest</span>
            <input 
              type="checkbox"
              class="hidden"
              bind:checked={sortByLatest}
            />
          </label>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-[rgba(0,0,0,0.05)]">
        <button 
          on:click={clearAll}
          class="text-base text-[#EE434A] hover:opacity-70 transition-opacity"
        >
          Clear all
        </button>
        <button 
          on:click={handleFilter}
          class="px-6 py-2 bg-[#EE434A] text-white rounded-lg hover:opacity-70 transition-opacity text-base"
        >
          Add filter
        </button>
      </div>
    </div>
  </div>
{/if} 