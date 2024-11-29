<script lang="ts">
  import type { VideoItem } from '$lib/types/course';
  import { Plus } from 'lucide-svelte';
  
  export let moduleIndex: number;
  export let onVideoAdd: (video: VideoItem, moduleIndex: number) => void;
  
  let url = '';
  let error = '';
  let loading = false;

  function getYoutubeVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  async function handleSubmit() {
    error = '';
    loading = true;
    
    try {
      const videoId = getYoutubeVideoId(url);
      
      if (!videoId) {
        error = 'Invalid YouTube URL';
        return;
      }

      const response = await fetch(`/api/video-metadata?videoId=${videoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video details');
      }
      
      const metadata = await response.json();

      const video: VideoItem = {
        videoId,
        videoUrl: url,
        title: metadata.title,
        description: 'User-added video',
        length: metadata.duration,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      };

      onVideoAdd(video, moduleIndex);
      url = '';
    } catch (err) {
      console.error('Error adding video:', err);
      error = 'Failed to add video. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex gap-2 w-full">
  <input
    type="text"
    bind:value={url}
    placeholder="Paste YouTube URL"
    class="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-[#EE434A] focus:border-transparent outline-none"
    disabled={loading}
  />
  <button
    on:click={handleSubmit}
    disabled={loading}
    class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {#if loading}
      <span class="flex items-center">
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Adding...
      </span>
    {:else}
      <Plus class="w-4 h-4 mr-2" />
      Add
    {/if}
  </button>
</div>

{#if error}
  <p class="text-red-500 text-sm mt-1">{error}</p>
{/if}
