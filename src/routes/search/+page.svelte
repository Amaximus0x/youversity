<script lang="ts">
  import { page } from '$app/stores';
  import { searchCourses, saveRecentSearch, getRecentSearches, getSearchRecommendations, type SearchFilter } from '$lib/services/search';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import TrendingCourseList from '$lib/components/TrendingCourseList.svelte';
  import FilterModal from '$lib/components/FilterModal.svelte';
  import CourseCard from '$lib/components/CourseCard.svelte';

  let searchQuery = '';
  let currentFilter: SearchFilter = 'relevance';
  let searchResults: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let error: string | null = null;
  let showFilterModal = false;
  let recentSearches = getRecentSearches();
  let recommendations: string[] = [];

  // Update search query and filter from URL parameters
  $: {
    const urlParams = new URLSearchParams($page.url.search);
    const q = urlParams.get('q');
    const f = urlParams.get('filter') as SearchFilter;
    
    let shouldSearch = false;
    
    if (q && q !== searchQuery) {
      searchQuery = q;
      shouldSearch = true;
    }
    
    if (f && f !== currentFilter) {
      currentFilter = f;
      shouldSearch = true;
    }
    
    if (shouldSearch && searchQuery) {
      performSearch();
    }
  }

  onMount(async () => {
    // Load recommendations if no search query
    if (!searchQuery) {
      try {
        recommendations = await getSearchRecommendations();
      } catch (error) {
        console.error('Error loading recommendations:', error);
      }
    }
  });

  async function performSearch() {
    if (!searchQuery.trim()) return;
    
    try {
      loading = true;
      error = null;
      console.log('Performing search with:', {
        query: searchQuery,
        filter: currentFilter
      });
      const results = await searchCourses(searchQuery, currentFilter);
      console.log('Search results:', results); // Debug log
      searchResults = results.courses;
      
      if (searchQuery) {
        saveRecentSearch(searchQuery);
        recentSearches = getRecentSearches();
      }
    } catch (err) {
      console.error('Error searching courses:', err);
      error = 'Failed to search courses. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleFilterChange(newFilter: SearchFilter) {
    currentFilter = newFilter;
    showFilterModal = false;
    goto(`/search?q=${encodeURIComponent(searchQuery)}&filter=${newFilter}`, { replaceState: true });
    performSearch();
  }

  function handleSearch(query: string) {
    searchQuery = query;
    goto(`/search?q=${encodeURIComponent(query)}&filter=${currentFilter}`);
  }

  function handleShare(courseId: string) {
    // Implement share functionality
  }

  const onFilterChange = handleFilterChange;

  onDestroy(() => {
    window.removeEventListener('filterchange', handleFilterChange as EventListener);
  });
</script>

<div class="max-w-[1440px] p-4">
  {#if !searchQuery}
    <!-- Recent Searches -->
    {#if recentSearches.length > 0}
      <div class="mb-8">
        <h2 class="text-h4-medium mb-4">Recent Searches</h2>
        <div class="flex flex-wrap gap-2">
          {#each recentSearches as search}
            <button
              class="px-4 py-2 bg-white dark:bg-dark-bg-primary border border-black/5 rounded-xl hover:border-brand-red transition-colors"
              on:click={() => handleSearch(search.query)}
            >
              {search.query}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Popular Searches -->
    {#if recommendations.length > 0}
      <div>
        <h2 class="text-h4-medium mb-4">Popular Searches</h2>
        <div class="flex flex-wrap gap-2">
          {#each recommendations as recommendation}
            <button
              class="px-4 py-2 bg-white dark:bg-dark-bg-primary border border-black/5 rounded-xl hover:border-brand-red transition-colors"
              on:click={() => handleSearch(recommendation)}
            >
              {recommendation}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <!-- <div class="mb-8">
      <h1 class="text-2xl font-bold text-[#2A4D61] mb-4">
        Search Results for "{searchQuery}"
      </h1>
    </div> -->

    {#if loading}
      <div class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-red"></div>
      </div>
    {:else if error}
      <div class="text-center py-8 text-red-500">
        {error}
      </div>
    {:else if searchResults.length === 0}
      <div class="text-center py-8 text-gray-500">
        No results found for "{searchQuery}"
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each searchResults as course (course.id)}
          <CourseCard {course} onShare={handleShare} />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<FilterModal 
  show={showFilterModal}
  currentFilter={currentFilter}
  onFilterChange={handleFilterChange}
  onClose={() => showFilterModal = false}
/> 