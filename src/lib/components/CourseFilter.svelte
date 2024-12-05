<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleChange(event) {
    dispatch('filterChange', event.target.value);
  }
</script>

<div class="mb-4">
  <select 
    class="px-4 py-2 border border-[#D9E1E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE434A] text-[#2A4D61] bg-white w-full sm:w-auto"
    on:change={handleChange}
  >
    <option value="default">Sort by</option>
    <option value="name-asc">Name (A-Z)</option>
    <option value="name-desc">Name (Z-A)</option>
    <option value="date-new">Newest First</option>
    <option value="date-old">Oldest First</option>
  </select>
</div> 