<script lang="ts">
  import type { CourseStructure, VideoItem } from "$lib/types/course";
  import { Play, ChevronLeft, ChevronRight, Edit2 } from "lucide-svelte";
  import VideoPlayer from "./VideoPlayer.svelte";
  import { fade, scale } from "svelte/transition";

  export let courseStructure: CourseStructure;
  export let moduleVideos: VideoItem[][];
  export let selectedVideos: number[];
  export let currentModuleIndex: number;
  export let error: string | null = null;

  let showVideoPlayer = false;
  let currentPlayingVideo: VideoItem | null = null;
  let sliderRef: HTMLDivElement;
  let showLeftArrow = false;
  let showRightArrow = true;

  // Add a reactive statement to watch currentModuleIndex changes
  $: if (sliderRef && currentModuleIndex !== undefined) {
    // Reset scroll position when module changes
    sliderRef.scrollTo({ left: 0, behavior: "smooth" });
    updateArrows();
  }

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

  function updateArrows() {
    if (sliderRef) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef;
      showLeftArrow = scrollLeft > 0;
      showRightArrow = scrollLeft + clientWidth < scrollWidth;
    }
  }

  function scroll(direction: "left" | "right") {
    if (sliderRef) {
      const scrollAmount = direction === "left" ? -320 : 320;
      sliderRef.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  }
</script>

<div class="relative p-2">
  {#if moduleVideos[currentModuleIndex]?.length}
    {#if showLeftArrow}
      <button
        class="absolute -left-3 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-20 hover:bg-gray-50"
        on:click={() => scroll("left")}
      >
        <ChevronLeft class="w-6 h-6 text-[#2A4D61]" />
      </button>
    {/if}

    <div
      bind:this={sliderRef}
      class="flex gap-6 overflow-x-auto scrollbar-hide pb-16 px-2 pt-2"
      on:scroll={updateArrows}
    >
      {#each moduleVideos[currentModuleIndex] as video, videoIndex}
        <!-- Video Card Container -->
        <div class="flex-shrink-0 w-[341px]">
          <!-- Video Card with Selection Highlight -->
          <div 
            class="group relative p-2 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer border "
            class:ring-2={selectedVideos[currentModuleIndex] === videoIndex}
            class:ring-brand-red={selectedVideos[currentModuleIndex] === videoIndex}
            class:ring-offset-2={selectedVideos[currentModuleIndex] === videoIndex}
            on:click={() => selectVideo(videoIndex)}
          >
            <div class="flex flex-col gap-2">
              <!-- Title and Duration Section -->
              <div class="h-[62px] flex flex-col">
                <!-- Video Title -->
                <div class="flex gap-1">
                  <span class="text-semibody-medium text-light-text-secondary line-clamp-2 break-words">
                    {String(videoIndex + 1).padStart(2, '0')}: {video.title}
                  </span>
                  <!-- <span class="text-semibody-medium text-light-text-primary line-clamp-2">
                    {video.title}
                  </span> -->
                </div>
                <!-- Duration -->
                <div class="flex items-center">
                  <span class="text-mini-body text-light-text-tertiary">
                    {video.length} min
                  </span>
                </div>
              </div>

              <!-- Thumbnail Container -->
              <div class="relative aspect-video rounded-lg overflow-hidden">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  class="w-full h-full object-cover rounded-lg"
                />
                <!-- Play Button Overlay -->
                <div class="absolute inset-0 bg-black/20 hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                  <button
                    class="text-white hover:scale-110 transform transition-transform duration-200"
                    on:click|stopPropagation={(e) => handlePlayVideo(video, e)}
                  >
                    <img src="/icons/youtube-icon.svg" alt="Play" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if showRightArrow}
      <button
        class="absolute -right-3 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-20 hover:bg-gray-50"
        on:click={() => scroll("right")}
      >
        <ChevronRight class="w-6 h-6 text-[#2A4D61]" />
      </button>
    {/if}
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
        <svg
          class="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
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
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
