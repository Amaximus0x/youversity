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
      <p class="text-[32px] font-medium">1.5k</p>
    </div>

    <!-- Average Ratings -->
    <div class="border-l border-[rgba(0,0,0,0.05)] pl-8">
      <h3 class="text-[#A3A3A3] text-base mb-1">Average Ratings</h3>
      <div class="flex items-center gap-2">
        <p class="text-[32px] font-medium">3.0</p>
        <div class="flex items-center gap-1">
          {#each Array(5) as _, i}
            <img 
              src="/icons/star.svg"
              alt="star"
              class="w-4 h-4"
              style={i >= 3 ? 'opacity: 0.2;' : ''}
            />
          {/each}
        </div>
      </div>
    </div>

    <!-- Add Review Button -->
    <button 
      class="ml-auto px-4 py-2 bg-[#F5F5F5] text-base rounded-lg hover:bg-[#EBEBEB] transition-colors"
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