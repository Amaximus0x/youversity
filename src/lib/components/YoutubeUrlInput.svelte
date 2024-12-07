<script lang="ts">
  import type { VideoItem } from '$lib/types/course';
  import { Plus, X, Play } from 'lucide-svelte';
  
  export let moduleIndex: number;
  export let onVideoAdd: (video: VideoItem, moduleIndex: number) => void;
  
  let url = '';
  let error = '';
  let loading = false;
  let previewVideo: VideoItem | null = null;
  let showPreview = false;

  function clearUrl() {
    url = '';
    error = '';
    previewVideo = null;
    showPreview = false;
  }

  // Enhanced YouTube URL validation
  function getYoutubeVideoId(url: string): string | null {
    try {
      // Handle different YouTube URL formats
      const patterns = [
        /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
        /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
        /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
        /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/,
        /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // Format duration from seconds to MM:SS
  function formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  async function validateAndPreview() {
    error = '';
    loading = true;
    previewVideo = null;
    showPreview = false;
    
    try {
      const videoId = getYoutubeVideoId(url);
      
      if (!videoId) {
        error = 'Please enter a valid YouTube URL';
        return;
      }

      // Check if video exists and is available
      const response = await fetch(`/api/video-metadata?videoId=${videoId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch video details');
      }
      
      const metadata = await response.json();

      if (!metadata.title) {
        throw new Error('Could not fetch video title');
      }

      // Create preview video object with properly formatted metadata
      previewVideo = {
        videoId,
        videoUrl: url,
        title: metadata.title || 'Untitled Video',
        description: metadata.description || '',
        length: metadata.duration ? Math.floor(metadata.duration / 60) : 0, // Convert seconds to minutes
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: formatDuration(metadata.duration)
      };

      showPreview = true;
    } catch (err) {
      console.error('Error validating video:', err);
      error = err instanceof Error ? err.message : 'Failed to validate video. Please try again.';
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    if (!previewVideo) {
      await validateAndPreview();
      if (!previewVideo) return;
    }

    try {
      onVideoAdd(previewVideo, moduleIndex);
      url = '';
      previewVideo = null;
      showPreview = false;
    } catch (err) {
      console.error('Error adding video:', err);
      error = 'Failed to add video. Please try again.';
    }
  }

  // Auto-validate URL after user stops typing
  let debounceTimer: NodeJS.Timeout;
  function handleUrlInput() {
    clearTimeout(debounceTimer);
    error = '';
    previewVideo = null;
    showPreview = false;
    
    if (url.trim()) {
      debounceTimer = setTimeout(validateAndPreview, 500);
    }
  }

  $: if (url) handleUrlInput();
</script>

<div class="space-y-4 w-full">
  <div class="flex gap-2 w-full">
    <div class="flex-1 relative">
      <input
        type="text"
        bind:value={url}
        placeholder="Paste YouTube URL"
        class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#EE434A] focus:border-transparent outline-none {error ? 'border-red-500' : ''} pr-10"
        disabled={loading}
      />
      {#if url}
        <button
          on:click={clearUrl}
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          title="Clear input"
        >
          <X class="w-4 h-4" />
        </button>
      {/if}
    </div>
    {#if !showPreview}
      <button
        on:click={validateAndPreview}
        disabled={loading || !url.trim()}
        class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if loading}
          <span class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Validating...
          </span>
        {:else}
          <Play class="w-4 h-4 mr-2" />
          Preview
        {/if}
      </button>
    {/if}
  </div>

  {#if error}
    <p class="text-red-500 text-sm">
      {error}
    </p>
  {/if}

  {#if showPreview && previewVideo}
    <div class="bg-gray-50 rounded-lg p-4 relative">
      <div class="absolute top-2 right-2 z-10 flex gap-2">
        <button
          on:click={handleSubmit}
          class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors duration-200"
          title="Add video"
        >
          <Plus class="w-4 h-4" />
        </button>
        <button
          on:click={() => { showPreview = false; previewVideo = null; }}
          class="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200"
          title="Cancel"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="aspect-video w-full mb-4 relative">
        <iframe
          src="https://www.youtube.com/embed/{previewVideo.videoId}"
          title={previewVideo.title}
          class="w-full h-full rounded-lg"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
        <div class="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          {previewVideo.duration || formatDuration(previewVideo.length * 60)}
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="font-semibold text-[#2A4D61] line-clamp-2">
          {previewVideo.title}
        </h3>
        <p class="text-sm text-gray-600 line-clamp-2">
          {previewVideo.description}
        </p>
      </div>
    </div>
  {/if}
</div>
