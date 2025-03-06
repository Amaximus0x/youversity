<script lang="ts">
  import type { VideoItem } from "$lib/types/course";
  import { X, Play } from "lucide-svelte";
  import VideoPlayerModal from "./VideoPlayerModal.svelte";

  export let moduleIndex: number;
  export let onVideoAdd: (
    video: VideoItem,
    moduleIndex: number,
    addAtBeginning: boolean,
  ) => void;
  export let moduleTitle: string;
  export let onClose: () => void;

  let url = "";
  let error = "";
  let loading = false;
  let previewVideo: VideoItem | null = null;
  let showVideoPlayer = false;

  function clearUrl() {
    url = "";
    error = "";
    previewVideo = null;
  }

  // Enhanced YouTube URL validation
  function getYoutubeVideoId(url: string): string | null {
    try {
      const patterns = [
        /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
        /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
        /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
        /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/,
        /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/,
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

  // Get standardized YouTube URLs
  function getYoutubeUrls(videoId: string) {
    return {
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&widgetid=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hq720.jpg`,
    };
  }

  function openYoutubeSearch() {
    const searchQuery = encodeURIComponent(moduleTitle);
    window.open(
      `https://www.youtube.com/results?search_query=${searchQuery}`,
      "_blank",
    );
  }

  async function validateUrl() {
    error = "";
    loading = true;
    previewVideo = null;

    try {
      const videoId = getYoutubeVideoId(url);

      if (!videoId) {
        error = "Please enter a valid YouTube URL";
        return;
      }

      const urls = getYoutubeUrls(videoId);

      // Fetch video metadata
      const response = await fetch(`/api/video-metadata?videoId=${videoId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch video details");
      }

      // Create preview video object
      previewVideo = {
        videoId,
        videoUrl: urls.watchUrl,
        title: data.data.title,
        description: "",
        length: data.data.duration,
        thumbnailUrl: urls.thumbnailUrl,
      };
    } catch (err) {
      console.error("Error validating video:", err);
      error = err instanceof Error ? err.message : "Failed to validate video";
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    if (!previewVideo) return;

    try {
      onVideoAdd(previewVideo, moduleIndex, true);
      onClose();
    } catch (err) {
      console.error("Error adding video:", err);
      error = "Failed to add video. Please try again.";
    }
  }

  // Auto-validate URL after user stops typing
  let debounceTimer: NodeJS.Timeout;
  function handleUrlInput() {
    clearTimeout(debounceTimer);
    error = "";
    previewVideo = null;

    if (url.trim()) {
      debounceTimer = setTimeout(validateUrl, 500);
    }
  }

  $: if (url) handleUrlInput();
  $: isPreviewEnabled = url.trim() && !loading && !error;
  $: isContinueEnabled = previewVideo !== null;
</script>

<div
  class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
>
  <div
    class="p-4 bg-gradient-light dark:bg-gradient-dark rounded-2xl w-full max-w-sm"
  >
    <!-- Content -->
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex justify-center items-center pb-4 border-b border-light-border dark:border-dark-border">
        <!-- <div class="flex justify-center items-center gap-2"> -->
        <h2
          class="w-full text-center text-body-semibold text-light-text-primary dark:text-dark-text-primary"
        >
          Add Custom Video
        </h2>
        <!-- </div> -->
        <button class="items-end justify-end" on:click={onClose}>
          <img src="/icons/cancel-circle.svg" alt="Close" class="w-6 h-6" />
        </button>
      </div>

      <div class="space-y-4">
        <!-- Search on YouTube button -->
        <div class="flex justify-end">
          <button
            on:click={openYoutubeSearch}
            class="flex items-center justify-center text-semibody-medium text-brand-turquoise gap-2 border-b border-brand-turquoise"
          >
            Search directly from youtube
            <img
              src="/icons/arrow-up-right.svg"
              alt="YouTube"
              class="w-6 h-6"
            />
          </button>
        </div>

        <!-- URL Input -->
        <div class="space-y-2">
          <input
            type="text"
            bind:value={url}
            placeholder="Paste YouTube URL"
            class="w-full h-12 pl-4 pr-2 py-1.75 border rounded-2xl bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-red border-none focus:border-transparent outline-none {error
              ? 'border-red-500'
              : ''}"
            disabled={loading}
          />
          {#if error}
            <p class="text-red-500 text-sm">{error}</p>
          {/if}
        </div>
        <div class="flex justify-end">
          <button
            on:click={() => (showVideoPlayer = true)}
            disabled={!isPreviewEnabled}
          class="flex py-2 px-4 gap-2 rounded-full text-semibody-medium transition-colors {isPreviewEnabled
            ? 'bg-brand-red hover:bg-ButtonHover text-white'
            : 'bg-Black/5 dark:bg-dark-bg-secondary text-Grey'}"
        >
          Preview
          <svg class="w-6 h-6 transition-colors text-brand-red" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="play-circle-02">
            <path id="Vector" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/>
            <path id="Vector_2" d="M9.5 11.1998V12.8002C9.5 14.3195 9.5 15.0791 9.95576 15.3862C10.4115 15.6932 11.0348 15.3535 12.2815 14.6741L13.7497 13.8738C15.2499 13.0562 16 12.6474 16 12C16 11.3526 15.2499 10.9438 13.7497 10.1262L12.2815 9.32594C11.0348 8.6465 10.4115 8.30678 9.95576 8.61382C9.5 8.92086 9.5 9.6805 9.5 11.1998Z" fill="currentColor"/>
            </g>
            </svg>
            
          </button>
        </div>
      </div>

      <button
        on:click={handleSubmit}
        disabled={!isContinueEnabled}
        class="w-full py-2 px-2 rounded-lg text-semi-body transition-colors {isContinueEnabled
          ? 'bg-brand-red hover:bg-ButtonHover text-white'
          : 'bg-Black/5 dark:bg-white/10 text-Grey'}"
      >
        Continue
      </button>
    </div>

  </div>
</div>

{#if showVideoPlayer && previewVideo}
  <VideoPlayerModal
    videoId={previewVideo.videoId}
    title={previewVideo.title}
    onClose={() => (showVideoPlayer = false)}
  />
{/if}
