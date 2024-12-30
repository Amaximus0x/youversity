<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { submitCourseRating, getCourseRatings, getUserCourseRating } from '$lib/firebase';
  import type { CourseRating } from '$lib/types/course';
  import { Star, StarHalf } from 'lucide-svelte';
  import { onMount } from 'svelte';

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

<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-2xl font-semibold mb-6">Course Reviews</h2>

  <!-- Average Rating Display -->
  <div class="flex items-center gap-4 mb-8">
    <div class="flex items-center">
      {#each Array(5) as _, i}
        {#if i < Math.floor(averageRating)}
          <Star class="w-6 h-6 text-yellow-400" fill="currentColor" />
        {:else if i === Math.floor(averageRating) && (averageRating % 1) >= 0.5}
          <StarHalf class="w-6 h-6 text-yellow-400" fill="currentColor" />
        {:else}
          <Star class="w-6 h-6 text-gray-300" fill="none" />
        {/if}
      {/each}
    </div>
    <span class="text-lg font-medium">{averageRating}</span>
    <span class="text-gray-500">({ratings.length} {ratings.length === 1 ? 'review' : 'reviews'})</span>
  </div>

  <!-- Add Review Button -->
  {#if $user && !showReviewForm}
    <button
      class="mb-8 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      on:click={() => showReviewForm = true}
    >
      Write a Review
    </button>
  {/if}

  <!-- Review Form -->
  {#if showReviewForm && $user}
    <form 
      on:submit|preventDefault={handleSubmitRating}
      class="mb-8 p-6 bg-gray-50 rounded-lg"
    >
      <h3 class="text-lg font-semibold mb-4">Your Review</h3>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
        <div class="flex gap-2">
          {#each Array(5) as _, i}
            <button
              type="button"
              class="focus:outline-none"
              on:click={() => userRating = i + 1}
            >
              <Star 
                class="w-6 h-6 {i < userRating ? 'text-yellow-400' : 'text-gray-300'}"
                fill={i < userRating ? 'currentColor' : 'none'}
              />
            </button>
          {/each}
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Review</label>
        <textarea
          bind:value={userReview}
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="4"
          placeholder="Write your review here..."
          required
        ></textarea>
      </div>

      <div class="flex gap-4">
        <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={submitting || !userRating}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          type="button"
          class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          on:click={() => showReviewForm = false}
        >
          Cancel
        </button>
      </div>

      {#if error}
        <p class="mt-4 text-red-500">{error}</p>
      {/if}
    </form>
  {/if}

  <!-- Reviews List -->
  {#if loading}
    <div class="animate-pulse space-y-4">
      {#each Array(3) as _}
        <div class="bg-gray-100 h-32 rounded-lg"></div>
      {/each}
    </div>
  {:else if ratings.length === 0}
    <p class="text-gray-500 text-center py-8">No reviews yet. Be the first to review this course!</p>
  {:else}
    <div class="space-y-6">
      {#each ratings as rating}
        <div class="border-b pb-6 last:border-b-0">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-3">
              {#if rating.userPhotoURL}
                <img 
                  src={rating.userPhotoURL} 
                  alt={rating.userDisplayName}
                  class="w-10 h-10 rounded-full"
                />
              {:else}
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span class="text-gray-600 font-medium">
                    {rating.userDisplayName[0].toUpperCase()}
                  </span>
                </div>
              {/if}
              <div>
                <p class="font-medium">{rating.userDisplayName}</p>
                <p class="text-sm text-gray-500">{formatDate(rating.createdAt)}</p>
              </div>
            </div>
            <div class="flex">
              {#each Array(5) as _, i}
                <Star 
                  class="w-5 h-5 {i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}"
                  fill={i < rating.rating ? 'currentColor' : 'none'}
                />
              {/each}
            </div>
          </div>
          <p class="text-gray-700">{rating.review}</p>
        </div>
      {/each}
    </div>
  {/if}
</div> 