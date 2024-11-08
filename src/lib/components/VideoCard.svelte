<!-- src/lib/components/VideoCard.svelte -->
<script lang="ts">
    import type { VideoItem } from '$lib/types/course';
    export let video: VideoItem;
    export let selected: boolean = false;
    export let onClick: () => void;
  </script>
  
  <button
    type="button"
    class="flex-shrink-0 w-full p-4 border rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105
           {selected ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-red-300'}"
    on:click={onClick}
  >
    <div class="relative">
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        class="w-full h-48 object-cover rounded-lg mb-2"
      />
      <span class="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
        {video.duration}
      </span>
    </div>
    
    <h4 class="font-semibold mb-2 line-clamp-2">{video.title}</h4>
    <p class="text-sm text-gray-600 line-clamp-3">{video.description}</p>
  </button>