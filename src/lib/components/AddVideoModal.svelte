<script lang="ts">
  import { get } from "svelte/store";
  import { user } from "$lib/stores/auth";
  import { collection, addDoc } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import VideoPlayerModal from "./VideoPlayerModal.svelte";

  export let onClose: () => void;
  export let onVideoAdded: () => void;

  let url = "";
  let error = "";
  let loading = false;
  let processing = false;
  let saving = false;
  let previewVideo: any | null = null;
  let processedVideo: any | null = null;
  let showVideoPlayer = false;
  let currentStep = "";
  let processingSteps = [
    "Generating video summary...",
    "Determining video category...",
    "Finalizing video data..."
  ];
  let currentStepIndex = 0;

  function clearUrl() {
    url = "";
    error = "";
    previewVideo = null;
    processedVideo = null;
    processing = false;
    currentStep = "";
    currentStepIndex = 0;
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
    window.open("https://www.youtube.com", "_blank");
  }

  async function validateUrl() {
    error = "";
    loading = true;
    processing = false;
    previewVideo = null;
    processedVideo = null;
    currentStep = "Validating YouTube URL...";

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
        title: data.data.title,
        summary: data.data.description || "",
        thumbnailUrl: urls.thumbnailUrl,
        publishedAt: data.data.publishedAt || new Date().toISOString(),
        duration: data.data.duration || "",
        videoUrl: urls.watchUrl,
      };

      // Automatically start processing after successful validation
      await processVideoContent();

    } catch (err) {
      console.error("Error validating video:", err);
      error = err instanceof Error ? err.message : "Failed to validate video";
    } finally {
      loading = false;
      processing = false;
      currentStep = "";
    }
  }

  async function processVideoContent() {
    if (!previewVideo) return;

    try {
      processing = true;
      currentStepIndex = 0;
      currentStep = processingSteps[0];

      // Process video with AI
      const response = await fetch('/api/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: previewVideo.videoId,
          title: previewVideo.title
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process video');
      }

      // Update steps as we process
      for (let i = 1; i < processingSteps.length; i++) {
        currentStepIndex = i;
        currentStep = processingSteps[i];
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      }

      // Store processed video data
      processedVideo = {
        ...previewVideo,
        summary: data.data.summary,
        tag: data.data.tag,
        hasTranscript: false
      };

    } catch (err) {
      console.error("Error processing video:", err);
      error = err instanceof Error ? err.message : "Failed to process video. Please try again.";
      throw err; // Re-throw to be caught by validateUrl
    }
  }

  async function handleSubmit() {
    if (!processedVideo) return;

    const currentUser = get(user);
    if (!currentUser) {
      error = "Please sign in to add videos";
      return;
    }

    try {
      saving = true;

      // Prepare video data for Firestore
      const videoData = {
        ...processedVideo,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      const savedVideosRef = collection(db, 'savedVideos');
      await addDoc(savedVideosRef, videoData);

      // Notify parent component to refresh the video list
      onVideoAdded();
      onClose();
    } catch (err) {
      console.error("Error saving video:", err);
      error = err instanceof Error ? err.message : "Failed to save video. Please try again.";
    } finally {
      saving = false;
    }
  }

  // Auto-validate URL after user stops typing
  let debounceTimer: NodeJS.Timeout;
  function handleUrlInput() {
    clearTimeout(debounceTimer);
    error = "";
    previewVideo = null;
    processedVideo = null;

    if (url.trim()) {
      debounceTimer = setTimeout(validateUrl, 500);
    }
  }

  $: if (url) handleUrlInput();
  $: isPreviewEnabled = url.trim() && !loading && !error && !processing && processedVideo !== null;
  $: isContinueEnabled = processedVideo !== null && !processing && !saving;
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
        <h2
          class="w-full text-center text-body-semibold text-light-text-primary dark:text-dark-text-primary"
        >
          Add Video to Library
        </h2>
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
            disabled={loading || processing || saving}
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
            <svg class="w-6 h-6 transition-colors {isPreviewEnabled ? 'text-white' : 'text-brand-red'}" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="play-circle-02">
                <path id="Vector" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/>
                <path id="Vector_2" d="M9.5 11.1998V12.8002C9.5 14.3195 9.5 15.0791 9.95576 15.3862C10.4115 15.6932 11.0348 15.3535 12.2815 14.6741L13.7497 13.8738C15.2499 13.0562 16 12.6474 16 12C16 11.3526 15.2499 10.9438 13.7497 10.1262L12.2815 9.32594C11.0348 8.6465 10.4115 8.30678 9.95576 8.61382C9.5 8.92086 9.5 9.6805 9.5 11.1998Z" fill="currentColor"/>
              </g>
            </svg>
          </button>
        </div>

        <!-- Processing Status -->
        {#if loading || processing}
          <div class="space-y-3 p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
              <span class="text-light-text-primary dark:text-dark-text-primary text-body">
                {loading && !processing ? 'Validating & Processing Video...' : 'Processing Video with AI'}
              </span>
            </div>
            
            {#if currentStep}
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                <span class="text-sm text-light-text-primary dark:text-dark-text-primary">{currentStep}</span>
              </div>
            {/if}

            {#if processing}
              <div class="space-y-2">
                {#each processingSteps as step, index}
                  <div class="flex items-center gap-2">
                    {#if index < currentStepIndex}
                      <svg class="w-4 h-4 text-Green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    {:else if index === currentStepIndex}
                      <div class="w-4 h-4 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                    {:else}
                      <div class="w-4 h-4 border-2 border-light-border dark:border-dark-border rounded-full"></div>
                    {/if}
                    <span class="text-sm {index <= currentStepIndex ? 'text-light-text-primary dark:text-dark-text-primary' : 'text-light-text-tertiary dark:text-dark-text-tertiary'}">{step}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Processed Video Summary -->
        {#if processedVideo && !processing}
          <div class="space-y-3 p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-Green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">Video Processed Successfully</span>
            </div>
            
                         <div class="space-y-2 text-sm">
               <div class="flex justify-between">
                 <span class="text-light-text-tertiary dark:text-dark-text-tertiary">Category:</span>
                 <span class="text-light-text-primary dark:text-dark-text-primary capitalize">{processedVideo.tag}</span>
               </div>
               <div class="flex justify-between">
                 <span class="text-light-text-tertiary dark:text-dark-text-tertiary">Summary:</span>
                 <span class="text-light-text-primary dark:text-dark-text-primary">Generated</span>
               </div>
             </div>
          </div>
        {/if}
      </div>

      <button
        on:click={handleSubmit}
        disabled={!isContinueEnabled}
        class="w-full py-2 px-2 rounded-lg text-semi-body transition-colors {isContinueEnabled
          ? 'bg-brand-red hover:bg-ButtonHover text-white'
          : 'bg-Black/5 dark:bg-white/10 text-Grey'}"
      >
        {saving ? 'Adding Video...' : 'Add to Library'}
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