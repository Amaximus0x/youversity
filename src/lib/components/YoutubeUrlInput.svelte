<script lang="ts">
  import type { VideoItem } from '$lib/types/course';
  
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

<div class="mt-4">
  <div class="flex gap-2">
    <input
      type="text"
      bind:value={url}
      placeholder="Paste YouTube URL"
      class="flex-1 p-2 border rounded"
      disabled={loading}
    />
    <button
      on:click={handleSubmit}
      disabled={loading}
      class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? 'Adding...' : 'Add'}
    </button>
  </div>
  {#if error}
    <p class="text-red-500 text-sm mt-1">{error}</p>
  {/if}
</div>
