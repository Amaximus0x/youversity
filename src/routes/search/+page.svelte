<script lang="ts">
  import { page } from '$app/stores';
  import { searchCourses, type SearchFilter } from '$lib/services/search';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import TrendingCourseList from '$lib/components/TrendingCourseList.svelte';
  import FilterModal from '$lib/components/FilterModal.svelte';

  let searchQuery = '';
  let currentFilter: SearchFilter = 'relevance';
  let searchResults: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let error: string | null = null;
  let showFilterModal = false;

  // Active filters
  let activeFilters = {
    ratings: [] as number[],
    sortByLatest: false
  };

  // Update search query from URL parameters
  $: {
    const urlParams = new URLSearchParams($page.url.search);
    const q = urlParams.get('q');
    if (q && q !== searchQuery) {
      searchQuery = q;
      performSearch();
    }
  }

  async function performSearch() {
    if (!searchQuery.trim()) return;
    
    try {
      loading = true;
      error = null;
      let results = await searchCourses(searchQuery);

      // Apply filters
      if (activeFilters.ratings.length > 0) {
        results = results.filter(course => 
          activeFilters.ratings.includes(Math.round(course.averageRating || 0))
        );
      }

      if (activeFilters.sortByLatest) {
        results.sort((a, b) => {
          const dateA = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0);
          const dateB = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0);
          return dateA.getTime() - dateB.getTime();
        });
      }

      searchResults = results;
    } catch (err) {
      console.error('Error searching courses:', err);
      error = 'Failed to search courses. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleFilterChange(event: CustomEvent<{ ratings: number[], sortByLatest: boolean }>) {
    activeFilters = event.detail;
    performSearch();
  }

  function removeFilter(type: 'rating' | 'date') {
    if (type === 'rating') {
      activeFilters.ratings = [];
    } else {
      activeFilters.sortByLatest = false;
    }
    performSearch();
  }

  onMount(() => {
    if (searchQuery) {
      performSearch();
    }
    window.addEventListener('filterchange', handleFilterChange as EventListener);
  });

  onDestroy(() => {
    window.removeEventListener('filterchange', handleFilterChange as EventListener);
  });
</script>

<div class="max-w-[1440px] p-4">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-[#2A4D61] mb-4">
      Search Results for "{searchQuery}"
    </h1>
  </div>

  <TrendingCourseList 
    courses={searchResults}
    layout="grid"
    {loading}
    {error}
  />
</div>

<FilterModal 
  show={showFilterModal}
  {currentFilter}
  onFilterChange={handleFilterChange}
  onClose={() => showFilterModal = false}
/> 