<script lang="ts">
  import type { CourseStructure, VideoItem } from '$lib/types/course';
  import { Play } from 'lucide-svelte';
  import VideoPlayer from './VideoPlayer.svelte';
  import { fade, scale } from 'svelte/transition';

  export let courseStructure: CourseStructure;
  export let moduleVideos: VideoItem[][];
  export let selectedVideos: number[];
  export let currentModuleIndex: number;
  export let error: string | null = null;

  let showVideoPlayer = false;
  let currentPlayingVideo: VideoItem | null = null;

  function handlePlayVideo(video: VideoItem, event: MouseEvent) {
    event.stopPropagation();
    currentPlayingVideo = video;
    showVideoPlayer = true;
  }

  function closeVideoPlayer() {
    showVideoPlayer = false;
    currentPlayingVideo = null;
  }

  function selectVideo(videoIndex: number) {
    selectedVideos[currentModuleIndex] = videoIndex;
    selectedVideos = [...selectedVideos];
  }
</script>

<div class="space-y-4">
  {#if moduleVideos[currentModuleIndex]?.length}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each moduleVideos[currentModuleIndex] as video, videoIndex}
        <div 
          class="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100"
          class:ring-2={selectedVideos[currentModuleIndex] === videoIndex}
          class:ring-[#EE434A]={selectedVideos[currentModuleIndex] === videoIndex}
          class:ring-offset-2={selectedVideos[currentModuleIndex] === videoIndex}
          on:click={() => selectVideo(videoIndex)}
        >
          <!-- Video Number and Duration -->
          <div class="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span class="bg-black/70 text-white px-2 py-1 rounded-md text-sm">
              0{videoIndex + 1}
            </span>
            <span class="bg-black/70 text-white px-2 py-1 rounded-md text-sm">
              {video.length} min
            </span>
          </div>

          <!-- Thumbnail with Play Button -->
          <div class="relative aspect-video">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
              <button
                class="text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 transform"
                on:click|stopPropagation={(e) => handlePlayVideo(video, e)}
              >
                <Play class="w-12 h-12" />
              </button>
            </div>
          </div>

          <!-- Video Info -->
          <div class="p-4">
            <h3 class="font-semibold text-[#2A4D61] line-clamp-2 mb-1">
              {video.title}
            </h3>
            <p class="text-sm text-gray-500 line-clamp-2">
              {video.description || 'No description available'}
            </p>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8 text-gray-500">
      No videos available for this module.
    </div>
  {/if}
</div>

<!-- Video Player Modal -->
{#if showVideoPlayer && currentPlayingVideo}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-6"
    on:click|self={closeVideoPlayer}
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="bg-white rounded-lg w-full h-[90vh] max-w-[90vw] md:max-w-[80vw] lg:max-w-[1200px] relative flex flex-col"
      in:scale={{ duration: 300, delay: 200, start: 0.95 }}
      out:scale={{ duration: 200, start: 1 }}
    >
      <button
        class="absolute -top-2 -right-2 bg-white p-1.5 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200 z-10"
        on:click={closeVideoPlayer}
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div class="flex-1 min-h-0 flex flex-col">
        <div class="relative flex-1">
          <VideoPlayer 
            videoId={currentPlayingVideo.videoId} 
            class="absolute inset-0"
          />
        </div>
        <div class="p-4 bg-white border-t">
          <h3 class="text-lg font-semibold text-[#2A4D61] truncate">
            {currentPlayingVideo.title}
          </h3>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style> 