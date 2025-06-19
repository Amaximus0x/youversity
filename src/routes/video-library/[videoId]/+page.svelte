<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'; // For navigation, e.g. upload button
  import AssignVideoModal from '$lib/components/AssignVideoModal.svelte'; // Import the modal
  import CreateCourseModal from '$lib/components/modals/CreateCourseModal.svelte';
  import AddToExistingCourseModal from '$lib/components/modals/AddToExistingCourseModal.svelte';
  import TagsSidebar from '$lib/components/TagsSidebar.svelte';
  import { user } from '$lib/stores/auth';
  import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import { get } from 'svelte/store';

  // Video details state
  let videoDetails: any = null;
  let loading = true;
  let error: string | null = null;

  // Tags and videos state
  let availableTags: { id: string; name: string; count: number }[] = [];
  let allVideos: any[] = [];
  let tagVideos: { [key: string]: any[] } = {};

  let currentVideoId: string | null = null;
  let showAssignModal = false; // State for controlling modal visibility
  let showCreateCourseModal = false;
  let showAddToExistingCourseModal = false;

  // For visual consistency with the main library page's tabs
  let activeTabForDisplay: 'saved' | 'assigned' = 'saved';
  let videoCountForDisplay = {
    saved: 0,
    assigned: 0,
  };

  // Function to extract video ID from various YouTube URL formats
  function extractYouTubeVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Function to create YouTube embed URL
  function createEmbedUrl(originalUrl: string): string {
    const videoId = extractYouTubeVideoId(originalUrl);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return originalUrl; // fallback to original URL
  }

  // Function to fetch video details
  async function fetchVideoDetails(videoId: string) {
    try {
      const videoDoc = await getDoc(doc(db, 'savedVideos', videoId));
      
      if (!videoDoc.exists()) {
        error = 'Video not found';
        return;
      }

      const videoData = videoDoc.data();
      videoDetails = {
        id: videoDoc.id,
        title: videoData.title,
        description: videoData.summary || videoData.description || '',
        videoUrl: videoData.videoUrl ? createEmbedUrl(videoData.videoUrl) : '',
        tag: videoData.tag,
        userId: videoData.userId,
        publishedAt: videoData.publishedAt,
        thumbnailUrl: videoData.thumbnailUrl
      };

      // Determine the tab based on current user and video ownership
      const currentUser = get(user);
      if (currentUser && videoData.userId === currentUser.uid) {
        activeTabForDisplay = 'saved';
      } else {
        activeTabForDisplay = 'saved';
      }

    } catch (err) {
      console.error('Error fetching video details:', err);
      error = err instanceof Error ? err.message : 'Failed to load video';
    }
  }

  // Function to fetch all videos for tags sidebar
  async function fetchAllVideos() {
    try {
      const currentUser = get(user);
      if (!currentUser) {
        return;
      }

      // Query to fetch only current user's videos for sidebar
      const videosRef = collection(db, 'savedVideos');
      const userVideosQuery = query(videosRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(userVideosQuery);
      
      allVideos = querySnapshot.docs.map(doc => ({
        videoId: doc.id,
        ...doc.data()
      }));

      // Update video counts - all videos are now user's videos
      videoCountForDisplay = {
        saved: allVideos.length, // All fetched videos are user's videos
        assigned: 0 // This will be implemented when assignment feature is added
      };

      // Extract unique tags and their counts
      const tagCounts = new Map<string, number>();
      const tagVideoMap: { [key: string]: any[] } = {};
      
      allVideos.forEach(video => {
        if (video.tag) {
          tagCounts.set(video.tag, (tagCounts.get(video.tag) || 0) + 1);
          if (!tagVideoMap[video.tag]) {
            tagVideoMap[video.tag] = [];
          }
          tagVideoMap[video.tag].push(video);
        }
      });

      // Convert tag counts to array format
      availableTags = Array.from(tagCounts.entries()).map(([id, count]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        count
      }));

      // Sort tags by count (most frequent first)
      availableTags.sort((a, b) => b.count - a.count);
      
      // Store tag videos mapping
      tagVideos = tagVideoMap;
      
    } catch (err) {
      console.error('Error fetching videos for sidebar:', err);
    }
  }

  // Reactive statement to handle URL parameter changes
  $: {
    const newVideoId = $page.params.videoId;
    if (newVideoId && newVideoId !== currentVideoId) {
      currentVideoId = newVideoId;
      loadVideoData(newVideoId);
    }
  }

  async function loadVideoData(videoId: string) {
    // Check if user is authenticated
    const currentUser = get(user);
    if (!currentUser) {
      error = 'Please sign in to view videos';
      loading = false;
      return;
    }
    
    loading = true;
    error = null;
    await fetchVideoDetails(videoId);
    await fetchAllVideos();
    loading = false;
  }

  onMount(() => {
    // Initial load will be handled by the reactive statement above
  });

  function handleUploadVideo() {
    goto('/video-library');
  }

  // Functions for action buttons under video
  function showInsights() { 
    if (currentVideoId) {
      goto(`/video-library/video-insight/${currentVideoId}`);
    }
  }
  function shareVideo() { 
    if (videoDetails) {
      // Create a shareable link
      const shareUrl = `${window.location.origin}/video-library/${videoDetails.id}`;
      if (navigator.share) {
        navigator.share({
          title: videoDetails.title,
          text: videoDetails.description,
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert('Video link copied to clipboard!');
        });
      }
    }
  }
  function createNewCourseWithVideo() { 
    showCreateCourseModal = true;
  }
  function addToExistingCourseWithVideo() {
    showAddToExistingCourseModal = true;
  }
  function assignVideo() { 
    showAssignModal = true; // Open the modal
  }
  function deleteVideo() { 
    if (videoDetails && confirm(`Are you sure you want to delete "${videoDetails.title}"?`)) {
      // TODO: Implement actual video deletion
      alert("Video deletion functionality to be implemented");
    }
  }

</script>

<!-- Overall page structure, p-6 for padding as seen in screenshots -->
<div class="min-h-screen text-light-text-primary dark:text-dark-text-primary">
  <div class="container mx-auto"> <!-- Container for max-width and centering -->

    <!-- Header Section (mimicking video-library/+page.svelte) -->
    <div class="mb-8">
      <h1 class="text-h2-mobile lg:text-h2 text-light-text-primary dark:text-dark-text-primary mb-4">
        Video Library
      </h1>
      <p class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body lg:text-body">
        Access all your saved and uploaded videos. Organize, preview, and turn them into learning content with ease.
      </p>
    </div>

    <!-- Tabs and Upload Section (mimicking video-library/+page.svelte) -->
    <div class="mb-6">
      <div class="relative border-b border-light-border dark:border-dark-border">
        <!-- This container matches the one in +page.svelte's tabs section -->
        <div class="container lg:pl-4 max-w-auto">
          <!-- Tabs -->
          <div class="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-1">
            <button
              class="pb-4 relative whitespace-nowrap {activeTabForDisplay === 'saved' ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
              on:click={() => activeTabForDisplay = 'saved'}
            >
              <span class="hidden lg:inline">Saved videos</span>
              <span class="lg:hidden">Saved</span>
              <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
                {videoCountForDisplay.saved}
              </span>
              {#if activeTabForDisplay === 'saved'}
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
              {/if}
            </button>
            <button
              class="pb-4 relative whitespace-nowrap {activeTabForDisplay === 'assigned' ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
              on:click={() => activeTabForDisplay = 'assigned'}
            >
              <span class="hidden lg:inline">Assigned videos</span>
              <span class="lg:hidden">Assigned</span>
              <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
                {videoCountForDisplay.assigned}
              </span>
              {#if activeTabForDisplay === 'assigned'}
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
              {/if}
            </button>
          </div>
          <!-- Add Video Button - Desktop -->
          <div class="hidden lg:flex items-center gap-4 absolute right-0 top-[-8px] h-full">
            <button
              class="flex items-center gap-2 px-2 pl-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors"
              on:click={handleUploadVideo}
            >
              <span class="text-body">Add video</span>
              <img src="/icons/BoxArrowUp.svg" alt="Add" class="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      <!-- Add Video Button - Mobile -->
      <div class="flex lg:hidden items-center justify-end gap-4 mt-4">
         <button
            class="flex items-center gap-2 px-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors"
            on:click={handleUploadVideo}
          >
            <span class="text-body text-nowrap">Add video</span>
            <img src="/icons/BoxArrowUp.svg" alt="Add" class="w-6 h-6" />
          </button>
      </div>
    </div>

    <!-- Main Content Area: Tags Sidebar + Single Video Details -->
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Left Sidebar - Tags Section (mimicking video-library/+page.svelte sidebar) -->
      <div class="hidden lg:block order-1">
        <TagsSidebar 
          {availableTags}
          {tagVideos}
          currentVideoId={videoDetails?.id}
          onTagDeleted={async () => {
            await fetchAllVideos();
            // If current video was deleted, redirect to main library
            if (videoDetails && !allVideos.some(v => v.videoId === videoDetails.id)) {
              goto('/video-library');
            }
          }}
        />
      </div>

      <!-- Right Content: Video Player and Details -->
      <div class="flex-1 min-w-0 order-2 lg:order-2">
        {#if loading}
          <!-- Loading State -->
          <div class="mb-8 h-[484px] rounded-3xl overflow-hidden shadow-lg bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse">
            <div class="w-full h-full flex items-center justify-center">
              <svg class="animate-spin h-8 w-8 text-light-text-tertiary dark:text-dark-text-tertiary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
          <div class="mb-8 h-8 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded animate-pulse"></div>
        {:else if error}
          <!-- Error State -->
          <div class="mb-8 h-[484px] rounded-3xl overflow-hidden shadow-lg bg-light-bg-secondary dark:bg-dark-bg-secondary flex items-center justify-center">
            <div class="text-center">
              <p class="text-light-text-secondary dark:text-dark-text-secondary mb-4">{error}</p>
              <button
                class="px-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors"
                on:click={() => goto('/video-library')}
              >
                Back to Video Library
              </button>
            </div>
        </div>
        {:else if videoDetails}
        <!-- Video Player -->
        <div class=" mb-8 h-[484px] rounded-3xl overflow-hidden shadow-lg bg-black">
            {#if videoDetails.videoUrl}
          <iframe
            class="w-full h-full"
            src={videoDetails.videoUrl}
            title="YouTube video player for {videoDetails.title}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
            {:else}
              <div class="w-full h-full flex items-center justify-center">
                <p class="text-white">Video not available</p>
              </div>
            {/if}
        </div>

        <!-- Video Title (actual title of the video) -->
        <h2 class="text-h3-mobile mb-8">{videoDetails.title}</h2>
        {/if}

        {#if videoDetails && !loading}
        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center justify-between mb-6 gap-y-4"> <!-- Main row container -->
            <!-- Group 1: Insights & Share (Stays on the left) -->
            <div class="flex items-center gap-3">
                <button on:click={showInsights} class="px-3 py-2 bg-black/5 dark:bg-white/10 text-Green dark:text-Green2 rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-semi-body">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-Green dark:text-Green2" viewBox="0 0 24 24" fill="none">
                        <path d="M21.75 19.5C21.75 19.6989 21.671 19.8897 21.5303 20.0303C21.3897 20.171 21.1989 20.25 21 20.25H3C2.80109 20.25 2.61032 20.171 2.46967 20.0303C2.32902 19.8897 2.25 19.6989 2.25 19.5V4.5C2.25 4.30109 2.32902 4.11032 2.46967 3.96967C2.61032 3.82902 2.80109 3.75 3 3.75C3.19891 3.75 3.38968 3.82902 3.53033 3.96967C3.67098 4.11032 3.75 4.30109 3.75 4.5V13.3472L8.50594 9.1875C8.63536 9.07421 8.79978 9.00885 8.97165 9.00236C9.14353 8.99587 9.31241 9.04866 9.45 9.15188L14.9634 13.2872L20.5059 8.4375C20.5786 8.36556 20.6652 8.30925 20.7605 8.27201C20.8557 8.23478 20.9575 8.21741 21.0597 8.22097C21.1619 8.22454 21.2623 8.24896 21.3547 8.29275C21.4471 8.33653 21.5296 8.39875 21.5971 8.47558C21.6645 8.5524 21.7156 8.64222 21.7471 8.7395C21.7786 8.83678 21.7899 8.93948 21.7802 9.04128C21.7706 9.14307 21.7402 9.24182 21.691 9.33146C21.6418 9.42109 21.5748 9.49972 21.4941 9.5625L15.4941 14.8125C15.3646 14.9258 15.2002 14.9912 15.0283 14.9976C14.8565 15.0041 14.6876 14.9513 14.55 14.8481L9.03656 10.7147L3.75 15.3403V18.75H21C21.1989 18.75 21.3897 18.829 21.5303 18.9697C21.671 19.1103 21.75 19.3011 21.75 19.5Z" fill="currentColor"/>
                        </svg>
                    Insights
                </button>
                <button on:click={shareVideo} class="px-3 py-2 bg-black/5 dark:bg-white/10 text-Green dark:text-Green2 rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-semi-body">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-Green dark:text-Green2" viewBox="0 0 24 24" fill="none">
                        <path d="M21 6.5C21 8.15685 19.6569 9.5 18 9.5C16.3431 9.5 15 8.15685 15 6.5C15 4.84315 16.3431 3.5 18 3.5C19.6569 3.5 21 4.84315 21 6.5Z" stroke="currentcolor" stroke-width="1.5"/>
                        <path d="M9 12C9 13.6569 7.65685 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.65685 9 9 10.3431 9 12Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M21 17.5C21 19.1569 19.6569 20.5 18 20.5C16.3431 20.5 15 19.1569 15 17.5C15 15.8431 16.3431 14.5 18 14.5C19.6569 14.5 21 15.8431 21 17.5Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M8.72852 10.7495L15.2285 7.75M8.72852 13.25L15.2285 16.2495" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                    Share
                </button>
            </div>

            <!-- Container for Right-Side Groups (Group 2 & Group 3) -->
            <div class="flex flex-wrap items-center gap-x-6 gap-y-3"> 
                <!-- Group 2: Course Actions -->
                <div class="flex items-center gap-3">
                    <button on:click={createNewCourseWithVideo} class="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors flex items-center gap-2 text-semibody-medium">
                        Create New Course
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button on:click={addToExistingCourseWithVideo} class="px-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors flex items-center gap-2 text-semibody-medium">
                        Add to Existing Course
                        <img src="/icons/FolderPlus.svg" alt="Add to Existing Course" class="w-5 h-5" />
                    </button>
                </div>

                <!-- Group 3: Assign & Delete -->
                <div class="flex items-center gap-3">
                    <button on:click={assignVideo} class="px-3 py-2 bg-black/5 dark:bg-white/10 text-light-text-secondary dark:text-dark-text-secondary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-semibody-medium">
                        Assign
                        <svg class="w-6 h-6 text-light-text-secondary  dark:text-dark-text-secondary"  viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="UserPlus"><path id="Vector" d="M24 13.2537C24 13.4527 23.921 13.6434 23.7803 13.7841C23.6397 13.9247 23.4489 14.0037 23.25 14.0037H21.75V15.5037C21.75 15.7027 21.671 15.8934 21.5303 16.0341C21.3897 16.1747 21.1989 16.2537 21 16.2537C20.8011 16.2537 20.6103 16.1747 20.4697 16.0341C20.329 15.8934 20.25 15.7027 20.25 15.5037V14.0037H18.75C18.5511 14.0037 18.3603 13.9247 18.2197 13.7841C18.079 13.6434 18 13.4527 18 13.2537C18 13.0548 18.079 12.8641 18.2197 12.7234C18.3603 12.5828 18.5511 12.5037 18.75 12.5037H20.25V11.0037C20.25 10.8048 20.329 10.6141 20.4697 10.4734C20.6103 10.3328 20.8011 10.2537 21 10.2537C21.1989 10.2537 21.3897 10.3328 21.5303 10.4734C21.671 10.6141 21.75 10.8048 21.75 11.0037V12.5037H23.25C23.4489 12.5037 23.6397 12.5828 23.7803 12.7234C23.921 12.8641 24 13.0548 24 13.2537ZM18.5747 18.7709C18.7027 18.9234 18.765 19.1204 18.7478 19.3187C18.7305 19.517 18.6352 19.7004 18.4828 19.8284C18.3304 19.9565 18.1334 20.0187 17.935 20.0015C17.7367 19.9843 17.5534 19.889 17.4253 19.7366C15.5391 17.4903 12.9459 16.2537 10.125 16.2537C7.30406 16.2537 4.71094 17.4903 2.82469 19.7366C2.69664 19.8889 2.51334 19.984 2.3151 20.0012C2.11687 20.0183 1.91995 19.956 1.76766 19.828C1.61536 19.6999 1.52018 19.5166 1.50304 19.3184C1.48589 19.1202 1.5482 18.9232 1.67625 18.7709C3.07688 17.1041 4.81875 15.92 6.75469 15.2862C5.57897 14.554 4.67374 13.4587 4.17594 12.1661C3.67814 10.8736 3.61486 9.45403 3.99567 8.1223C4.37649 6.79057 5.18067 5.61909 6.28657 4.7851C7.39246 3.95112 8.73989 3.5 10.125 3.5C11.5101 3.5 12.8575 3.95112 13.9634 4.7851C15.0693 5.61909 15.8735 6.79057 16.2543 8.1223C16.6351 9.45403 16.5719 10.8736 16.0741 12.1661C15.5763 13.4587 14.671 14.554 13.4953 15.2862C15.4312 15.92 17.1731 17.1041 18.5747 18.7709ZM10.125 14.7537C11.0892 14.7537 12.0317 14.4678 12.8334 13.9322C13.6351 13.3965 14.2599 12.6351 14.6289 11.7443C14.9979 10.8535 15.0944 9.87334 14.9063 8.92768C14.7182 7.98203 14.2539 7.11338 13.5721 6.4316C12.8904 5.74982 12.0217 5.28552 11.0761 5.09742C10.1304 4.90932 9.15021 5.00586 8.25942 5.37484C7.36863 5.74381 6.60726 6.36866 6.07159 7.17034C5.53591 7.97203 5.25 8.91457 5.25 9.87875C5.25149 11.1712 5.76558 12.4103 6.6795 13.3243C7.59342 14.2382 8.83253 14.7523 10.125 14.7537Z" fill="currentcolor"/></g></svg>
                    </button>
                    <button on:click={deleteVideo} class="p-2.5 bg-black/5 dark:bg-white/10 text-light-text-primary dark:text-dark-text-primary rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                        <img src="/icons/Trash.svg" alt="Delete" class="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Video Description -->
        <div class="text-body text-light-text-secondary dark:text-dark-text-secondary leading-relaxed prose dark:prose-invert max-w-none">
            {videoDetails.description || 'No description available.'}
        </div>
        {/if}
      </div>
    </div>

  </div>
</div> 

{#if videoDetails}
<AssignVideoModal bind:showModal={showAssignModal} on:close={() => showAssignModal = false} /> 
<CreateCourseModal bind:showModal={showCreateCourseModal} video={videoDetails} on:close={() => showCreateCourseModal = false} /> 
  <AddToExistingCourseModal bind:showModal={showAddToExistingCourseModal} video={videoDetails} on:close={() => showAddToExistingCourseModal = false} />
{/if} 