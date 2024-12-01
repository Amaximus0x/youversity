<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleChange(event) {
    dispatch('filterChange', event.target.value);
  }
</script>

<div class="mb-4">
  <select 
    class="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    on:change={handleChange}
  >
    <option value="default">Default Order</option>
    <option value="name-asc">Name (A-Z)</option>
    <option value="name-desc">Name (Z-A)</option>
    <option value="date-new">Newest First</option>
    <option value="date-old">Oldest First</option>
  </select>
</div> 