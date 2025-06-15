<!-- src/lib/components/TagsSidebar.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { collection, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import { user } from '$lib/stores/auth';
  import { get } from 'svelte/store';
  
  // Props
  export let availableTags: { id: string; name: string; count: number }[] = [];
  export let tagVideos: { [key: string]: any[] } = {};
  export let currentVideoId: string | null = null; // To highlight current video
  export let onTagDeleted: (() => void) | null = null; // Callback to refresh data
  
  // Internal state
  let tagSearchQuery = "";
  let expandedTagId: string | null = null;
  let deletingTag: string | null = null; // Track which tag is being deleted
  
  // Filter tags based on search query
  $: filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );
  
  function toggleTagExpansion(tagId: string) {
    expandedTagId = expandedTagId === tagId ? null : tagId;
  }
  
  function handleTagClick(tagId: string) {
    // Only toggle expansion for tag clicks
    toggleTagExpansion(tagId);
  }
  
  function handleVideoClick(videoId: string) {
    goto(`/video-library/${videoId}`);
  }
  
  async function handleDeleteTag(tagId: string) {
    const currentUser = get(user);
    if (!currentUser) {
      alert('Please sign in to delete videos.');
      return;
    }

    const tagName = availableTags.find(tag => tag.id === tagId)?.name || tagId;
    const videoCount = tagVideos[tagId]?.length || 0;
    
    // Confirmation dialog
    const confirmMessage = `Are you sure you want to delete all ${videoCount} video${videoCount !== 1 ? 's' : ''} in the "${tagName}" tag? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      deletingTag = tagId;
      
      // Get all videos for this tag that belong to the current user
      const videosToDelete = tagVideos[tagId] || [];
      const userVideos = videosToDelete.filter(video => video.userId === currentUser.uid);
      
      if (userVideos.length === 0) {
        alert('No videos found to delete or you do not have permission to delete these videos.');
        return;
      }

      // Delete each video document
      const deletePromises = userVideos.map(video => 
        deleteDoc(doc(db, 'savedVideos', video.videoId))
      );

      await Promise.all(deletePromises);

      // If we were viewing a video from this tag, redirect to main library
      if (currentVideoId && userVideos.some(video => video.videoId === currentVideoId)) {
        goto('/video-library');
      }

      // Collapse the expanded tag
      if (expandedTagId === tagId) {
        expandedTagId = null;
      }

      // Call the refresh callback to update the parent component
      if (onTagDeleted) {
        onTagDeleted();
      }

      alert(`Successfully deleted ${userVideos.length} video${userVideos.length !== 1 ? 's' : ''} from the "${tagName}" tag.`);
      
    } catch (error) {
      console.error('Error deleting videos:', error);
      alert('Failed to delete videos. Please try again.');
    } finally {
      deletingTag = null;
    }
  }
  
  // Auto-expand tag if current video belongs to it
  $: if (currentVideoId && availableTags.length > 0 && !expandedTagId) {
    // Find which tag contains the current video
    for (const tag of availableTags) {
      if (tagVideos[tag.id]?.some(video => video.videoId === currentVideoId)) {
        expandedTagId = tag.id;
        break;
      }
    }
    // If no tag found, expand first tag with videos
    if (!expandedTagId && availableTags.length > 0) {
      expandedTagId = availableTags[0].id;
    }
  }
</script>

<div class="w-[172px] flex-shrink-0">
  <!-- Tags Search Bar -->
  <div class="relative mb-2">
    <input
      type="text"
      placeholder="Tags"
      bind:value={tagSearchQuery}
      class="w-full h-[29px] pl-2 pr-8 bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border rounded-lg text-semi-body text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:border-brand-red transition-colors"
    />
    <div class="absolute right-3 top-1/2 -translate-y-1/2">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="text-light-text-tertiary dark:text-dark-text-tertiary"
      >
        <path
          d="M17.5 17.5L22 22"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11Z"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>

  <!-- Tags List -->
  <div class="space-y-1">
    {#each filteredTags as tag (tag.id)}
      <div class="space-y-1">
        <button
          class="w-full h-[29px] flex items-center justify-between px-2 py-1 rounded-lg transition-colors {expandedTagId === tag.id ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
          on:click={() => handleTagClick(tag.id)}
          disabled={deletingTag === tag.id}
        >
          <div class="flex items-center gap-2">
            <img 
              src="/icons/CaretRight.svg" 
              alt="Dropdown" 
              class="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary transition-transform {expandedTagId === tag.id ? '' : 'rotate-[-90deg]'}" 
            />
            <span class="text-semi-body-medium">
              {tag.name}
            </span>
          </div>
          <div class="flex items-center gap-2">
            
            {#if expandedTagId === tag.id}
              <button
                class="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors group"
                on:click|stopPropagation={() => handleDeleteTag(tag.id)}
                disabled={deletingTag === tag.id}
                title="Delete all videos in this tag"
              >
                {#if deletingTag === tag.id}
                  <svg class="animate-spin h-4 w-4 text-light-text-tertiary dark:text-dark-text-tertiary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                {:else}
                  <img 
                    src="/icons/Trash.svg" 
                    alt="Delete tag" 
                    class="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary group-hover:text-brand-red transition-colors" 
                  />
                {/if}
              </button>
            {:else}
              <span class="text-xs px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded-full">
                {tag.count}
              </span>
            {/if}
          </div>
        </button>

        {#if expandedTagId === tag.id}
          <div class="ml-2 pl-2 space-y-1 py-1 border-l border-light-border dark:border-dark-border">
            {#if tagVideos[tag.id] && tagVideos[tag.id].length > 0}
              {#each tagVideos[tag.id] as video (video.videoId)}
                <button 
                  class="w-full flex items-center gap-1.5 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-left {video.videoId === currentVideoId ? 'bg-brand-red/10' : ''}"
                  on:click={() => handleVideoClick(video.videoId)}
                  disabled={deletingTag === tag.id}
                >
                  <img 
                    src={video.thumbnailUrl || '/images/videoCardThumb.png'} 
                    alt="Video thumbnail" 
                    class="w-[23px] h-[15px] rounded object-cover flex-shrink-0" 
                  />
                  <span class="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium truncate {video.videoId === currentVideoId ? 'text-brand-red' : ''}">
                    {video.title}
                  </span>
                </button>
              {/each}
            {:else}
              <div class="px-1 py-2">
                <span class="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  No videos for this tag yet.
                </span>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div> 