<script lang="ts">
  import { page } from '$app/stores';
  import { searchCourses, type SearchFilter } from '$lib/services/search';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ArrowUpDown, Star, Clock } from 'lucide-svelte';
  import TrendingCourseList from '$lib/components/TrendingCourseList.svelte';

  let searchQuery = '';
  let currentFilter: SearchFilter = 'relevance';
  let searchResults: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let error: string | null = null;

  // Update search query from URL parameters
  $: {
    const urlParams = new URLSearchParams($page.url.search);
    const q = urlParams.get('q');
    const filter = urlParams.get('filter') as SearchFilter;
    
    if (q && q !== searchQuery) {
      searchQuery = q;
      performSearch();
    }
    if (filter && filter !== currentFilter) {
      currentFilter = filter;
      performSearch();
    }
  }

  async function performSearch() {
    if (!searchQuery.trim()) return;
    
    try {
      loading = true;
      error = null;
      searchResults = await searchCourses(searchQuery, currentFilter);
    } catch (err) {
      console.error('Error searching courses:', err);
      error = 'Failed to search courses. Please try again.';
    } finally {
      loading = false;
    }
  }

  function updateFilter(filter: SearchFilter) {
    const urlParams = new URLSearchParams($page.url.search);
    urlParams.set('filter', filter);
    goto(`?${urlParams.toString()}`, { replaceState: true });
    currentFilter = filter;
  }

  onMount(() => {
    if (searchQuery) {
      performSearch();
    }
  });
</script>

<div class="max-w-[1440px] p-4">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-[#2A4D61] mb-4">
      Search Results for "{searchQuery}"
    </h1>
    
    <!-- Filter buttons -->
    <div class="flex gap-4 mb-6">
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors {currentFilter === 'relevance' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}"
        on:click={() => updateFilter('relevance')}
      >
        <ArrowUpDown class="w-4 h-4" />
        <span>Relevance</span>
      </button>
      
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors {currentFilter === 'rating' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}"
        on:click={() => updateFilter('rating')}
      >
        <Star class="w-4 h-4" />
        <span>Rating</span>
      </button>
      
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors {currentFilter === 'latest' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}"
        on:click={() => updateFilter('latest')}
      >
        <Clock class="w-4 h-4" />
        <span>Latest</span>
      </button>
    </div>
  </div>

  <TrendingCourseList 
    courses={searchResults}
    layout="grid"
    {loading}
    {error}
  />
</div> 