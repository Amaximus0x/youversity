<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { submitCourseRating, getCourseRatings, getUserCourseRating } from '$lib/firebase';
  import type { CourseRating } from '$lib/types/course';
  import { Star, StarHalf } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  export let courseId: string;
  
  let ratings: CourseRating[] = [];
  let userRating = 0;
  let userReview = '';
  let loading = false;
  let error: string | null = null;
  let submitting = false;
  let showReviewForm = false;
  let averageRating = 0;

  onMount(async () => {
    try {
      loading = true;
      ratings = await getCourseRatings(courseId);
      console.log('Loaded ratings:', ratings);
      
      if ($user) {
        const existingRating = await getUserCourseRating($user.uid, courseId);
        if (existingRating) {
          userRating = existingRating.rating;
          userReview = existingRating.review;
        }
      }
      
      // Calculate initial average
      averageRating = getAverageRating();
    } catch (err) {
      console.error('Error loading ratings:', err);
      error = err instanceof Error ? err.message : 'Failed to load ratings';
    } finally {
      loading = false;
    }
  });

  async function handleSubmitRating() {
    if (!$user) return;
    
    try {
      submitting = true;
      error = null;
      
      await submitCourseRating(
        $user.uid,
        courseId,
        userRating,
        userReview,
        $user.displayName || 'Anonymous',
        $user.photoURL || undefined
      );
      
      // Refresh ratings
      ratings = await getCourseRatings(courseId);
      showReviewForm = false;
    } catch (err) {
      console.error('Error submitting rating:', err);
      error = err instanceof Error ? err.message : 'Failed to submit rating';
    } finally {
      submitting = false;
    }
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getAverageRating(): number {
    console.log('Calculating average for ratings:', ratings);
    if (!ratings || ratings.length === 0) {
      console.log('No ratings available');
      return 0;
    }
    
    let validRatings = ratings.filter(r => typeof r.rating === 'number' && !isNaN(r.rating));
    console.log('Valid ratings:', validRatings);
    
    if (validRatings.length === 0) {
      console.log('No valid numeric ratings found');
      return 0;
    }
    
    const total = validRatings.reduce((sum, r) => sum + r.rating, 0);
    const average = total / validRatings.length;
    console.log('Total:', total, 'Count:', validRatings.length, 'Average:', average);
    
    return Number(average.toFixed(1));
  }

  // Update averageRating whenever ratings change
  $: {
    if (ratings) {
      console.log('Ratings updated:', ratings);
      averageRating = getAverageRating();
      console.log('New average rating:', averageRating);
    }
  }
</script>

<div class="bg-transparent rounded-2xl border border-[rgba(0,0,0,0.05)] p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-medium">Course Reviews</h2>
    <button 
      class="text-[#42C1C8] text-base hover:opacity-70 transition-opacity flex items-center gap-1"
    >
      Read all
      <img src="/icons/arrow-right.svg" alt="arrow" class="w-5 h-5" />
    </button>
  </div>

  <div class="flex items-center gap-8 mb-8">
    <!-- Total Reviews -->
    <div>
      <h3 class="text-[#A3A3A3] text-base mb-1">Total Reviews</h3>
      <p class="text-[32px] font-medium">{ratings.length}</p>
    </div>

    <!-- Average Ratings -->
    <div class="border-l border-[rgba(0,0,0,0.05)] pl-8">
      <h3 class="text-[#A3A3A3] text-base mb-1">Average Ratings</h3>
      <div class="flex items-center gap-2">
        <p class="text-[32px] font-medium">{averageRating.toFixed(1)}</p>
        <div class="flex items-center gap-1">
          {#each Array(5) as _, i}
            <img 
              src="/icons/star.svg"
              alt="star"
              class="w-4 h-4"
              style={i >= averageRating ? 'opacity: 0.2;' : ''}
            />
          {/each}
        </div>
      </div>
    </div>

    <!-- Add Review Button -->
    <button 
      class="ml-auto px-4 py-2 bg-black/[0.05] text-[#1E3443] text-base rounded-lg hover:bg-black/[0.08] transition-colors"
      on:click={() => {
        if ($user) {
          showReviewForm = true;
        } else {
          goto('/login');
        }
      }}
    >
      Add Review
    </button>
  </div>

  <!-- Reviews List -->
  {#if loading}
    <div class="animate-pulse space-y-4">
      {#each Array(3) as _}
        <div class="bg-gray-100 h-32 rounded-lg"></div>
      {/each}
    </div>
  {:else if ratings.length === 0}
    <p class="text-[#A3A3A3] text-center py-8">No reviews yet. Be the first to review this course!</p>
  {:else}
    <div class="space-y-8">
      {#each ratings as rating}
        <div class="pb-8 border-b border-[rgba(0,0,0,0.05)] last:border-b-0">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              {#if rating.userPhotoURL}
                <img 
                  src={rating.userPhotoURL} 
                  alt={rating.userDisplayName}
                  class="w-12 h-12 rounded-full"
                />
              {:else}
                <div class="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                  <span class="text-[#2A4D61] font-medium">
                    {rating.userDisplayName[0].toUpperCase()}
                  </span>
                </div>
              {/if}
              <div>
                <p class="text-base font-medium">{rating.userDisplayName}</p>
                <p class="text-[#A3A3A3] text-base">{formatDate(rating.createdAt)}</p>
              </div>
            </div>
            <div class="flex gap-1">
              {#each Array(5) as _, i}
                <img 
                  src="/icons/star.svg"
                  alt="star"
                  class="w-4 h-4"
                  style={i >= rating.rating ? 'opacity: 0.2;' : ''}
                />
              {/each}
            </div>
          </div>
          <p class="text-base text-[#494848]">{rating.review}</p>
        </div>
      {/each}
    </div>
  {/if}
</div> 

<!-- Review Form Modal -->
{#if showReviewForm}
  <div 
    class="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-20"
    on:click={() => showReviewForm = false}
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="bg-white rounded-2xl w-[500px] overflow-hidden"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.05)]">
        <h2 class="text-base font-medium">Add Review</h2>
        <button 
          on:click={() => showReviewForm = false}
          class="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
        >
          <img src="/icons/cancel-square.svg" alt="Close" class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <form on:submit|preventDefault={handleSubmitRating} class="px-6 py-4">
        <div class="mb-6">
          <label class="block text-[#5F6368] text-sm mb-2">Rating</label>
          <div class="flex gap-2">
            {#each Array(5) as _, i}
              <button
                type="button"
                class="focus:outline-none"
                on:click={() => userRating = i + 1}
              >
                <img 
                  src="/icons/star.svg"
                  alt="star"
                  class="w-6 h-6"
                  style={i >= userRating ? 'opacity: 0.2;' : ''}
                />
              </button>
            {/each}
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-[#5F6368] text-sm mb-2">Review</label>
          <textarea
            bind:value={userReview}
            class="w-full px-4 py-3 border border-[rgba(0,0,0,0.05)] rounded-lg focus:outline-none focus:border-[#42C1C8] transition-colors"
            rows="4"
            placeholder="Write your review here..."
            required
          ></textarea>
        </div>

        {#if error}
          <p class="text-[#EE434A] text-sm mb-4">{error}</p>
        {/if}

        <div class="flex justify-end gap-4">
          <button
            type="button"
            class="px-4 py-2 text-[#5F6368] hover:bg-[#F5F5F5] rounded-lg transition-colors"
            on:click={() => showReviewForm = false}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-6 py-2 bg-[#42C1C8] text-white rounded-lg hover:opacity-70 transition-opacity disabled:opacity-50"
            disabled={submitting || !userRating}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if} 