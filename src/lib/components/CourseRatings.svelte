<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { submitCourseRating, getCourseRatings, getUserCourseRating } from '$lib/firebase';
  import type { CourseRating } from '$lib/types/course';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { page } from '$app/stores';

  export let courseId: string;
  export let showReadAll: boolean = true;
  
  let ratings: CourseRating[] = [];
  let loading = true;
  let error: string | null = null;
  let showReviewInput = false;
  let reviewText = '';
  let submitting = false;
  let userExistingReview: CourseRating | null = null;
  let isEditing = false;

  async function loadReviews() {
    try {
      loading = true;
      ratings = await getCourseRatings(courseId);
      
      // Check for user's existing review
      if ($user) {
        userExistingReview = await getUserCourseRating($user.uid, courseId);
        if (userExistingReview) {
          reviewText = userExistingReview.review;
        }
      }
    } catch (err: any) {
      error = err.message;
      console.error('Error loading reviews:', err);
    } finally {
      loading = false;
    }
  }

  async function handleSubmitReview() {
    if (!reviewText.trim() || !$user) return;

    try {
      submitting = true;
      await submitCourseRating(
        $user.uid,
        courseId,
        reviewText,
        $user.displayName || 'Anonymous',
        $user.photoURL
      );
      
      // Refresh the reviews list
      await loadReviews();
      
      // Reset the form
      showReviewInput = false;
      isEditing = false;
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      submitting = false;
    }
  }

  function handleEditReview() {
    if (userExistingReview) {
      reviewText = userExistingReview.review;
      isEditing = true;
      showReviewInput = true;
    }
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || timestamp;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Load reviews on mount
  onMount(loadReviews);
</script>

<!-- Course Reviews Section -->
<div class="bg-transparent rounded-2xl border border-light-border dark:border-dark-border p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-h3-mobile text-light-text-primary dark:text-dark-text-primary">Course Reviews</h2>
    {#if showReadAll}
      <button 
        class="text-brand-turquoise text-body hover:underline transition-opacity flex items-center gap-1"
        on:click={() => goto(`/course/${courseId}/module?tab=reviews`)}
      >
        Read all
        <img src="/icons/arrow-right.svg" alt="arrow" class="w-5 h-5" />
      </button>
    {/if}
  </div>

  <!-- Review Input Section -->
  {#if showReviewInput}
    <div transition:fade={{ duration: 200 }} class="mb-6">
      <form on:submit|preventDefault={handleSubmitReview} class="space-y-4">
        <textarea
          bind:value={reviewText}
          placeholder="Write your review..."
          class="w-full h-32 p-4 rounded-lg border border-light-border dark:border-dark-border bg-black/[0.05] text-light-text-primary dark:text-dark-text-primary resize-none focus:outline-none focus:border-brand-turquoise transition-colors"
        ></textarea>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2  bg-black/[0.05] text-brand-red/100 text-semibody-medium rounded-lg hover:bg-black/[0.08] transition-colors "
            on:click={() => {
              showReviewInput = false;
              isEditing = false;
              reviewText = userExistingReview?.review || '';
            }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2  bg-Green text-white text-semibody-medium rounded-lg hover:bg-GreenHover transition-colors disabled:opacity-50"
            disabled={!reviewText.trim() || submitting}
          >
            {submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  <div class="flex items-center gap-8 mb-8">
    <!-- Total Reviews -->
    <div>
      <h3 class="text-light-text-tertiary text-body">Total Reviews</h3>
      <p class="text-[32px] font-medium text-light-text-primary dark:text-dark-text-primary">
        {ratings.length}
      </p>
    </div>

    <!-- Add Review Button -->
    {#if $user && !showReviewInput}
      <button 
        class="ml-auto px-4 py-2 bg-black/[0.05] text-Green text-semibody-medium rounded-lg hover:bg-black/[0.08] transition-colors"
        on:click={() => {
          if (userExistingReview) {
            handleEditReview();
          } else {
            showReviewInput = true;
          }
        }}
      >
        {userExistingReview ? 'Edit Review' : 'Add Review'}
      </button>
    {/if}
  </div>

  <!-- Reviews List -->
  {#if loading}
    <div class="animate-pulse space-y-4">
      {#each Array(3) as _}
        <div class="bg-gray-100 h-32 rounded-lg"></div>
      {/each}
    </div>
  {:else if error}
    <p class="text-brand-red text-center py-4">{error}</p>
  {:else if ratings.length === 0}
    <p class="text-light-text-tertiary text-center py-8">
      No reviews yet. Be the first to review this course!
    </p>
  {:else}
    <div class="space-y-8">
      {#each ratings as review (review.userId + '-' + review.createdAt)}
        <div class="pb-8 border-b border-light-border dark:border-dark-border last:border-b-0">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              {#if review.userPhotoURL}
                <img 
                  src={review.userPhotoURL} 
                  alt={review.userDisplayName}
                  class="w-12 h-12 rounded-full object-cover"
                />
              {:else}
                <div class="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                  <span class="text-[#2A4D61] font-medium">
                    {review.userDisplayName[0].toUpperCase()}
                  </span>
                </div>
              {/if}
              <div>
                <p class="text-body-semibold text-light-text-primary dark:text-dark-text-primary">
                  {review.userDisplayName}
                </p>
                <p class="text-light-text-tertiary text-mini-body">
                  {formatDate(review.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <p class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary">
            {review.review}
          </p>
        </div>
      {/each}
    </div>
  {/if}
</div> 