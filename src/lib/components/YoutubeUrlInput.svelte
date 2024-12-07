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

      // Create preview video object
      previewVideo = {
        videoId,
        videoUrl: url,
        title: metadata.title,
        description: metadata.description || 'User-added video',
        length: metadata.duration,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
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
    <input
      type="text"
      bind:value={url}
      placeholder="Paste YouTube URL"
      class="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-[#EE434A] focus:border-transparent outline-none {error ? 'border-red-500' : ''}"
      disabled={loading}
    />
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

      <div class="aspect-video w-full mb-4">
        <iframe
          src="https://www.youtube.com/embed/{previewVideo.videoId}"
          title={previewVideo.title}
          class="w-full h-full rounded-lg"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>

      <div class="space-y-2">
        <h3 class="font-semibold text-[#2A4D61] line-clamp-2">
          {previewVideo.title}
        </h3>
        <p class="text-sm text-gray-600">
          Duration: {previewVideo.length} minutes
        </p>
      </div>
    </div>
  {/if}
</div>
