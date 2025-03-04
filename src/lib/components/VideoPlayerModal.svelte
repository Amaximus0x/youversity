<script lang="ts">
  import { X } from 'lucide-svelte';
  
  export let videoId: string;
  export let title: string;
  export let onClose: () => void;
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl w-full max-w-3xl">
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b">
      <h2 class="text-h4-medium text-Black">{title}</h2>
      <button 
        class="p-2 hover:bg-gray-100 rounded-full transition-colors"
        on:click={onClose}
      >
        <X class="w-6 h-6" />
      </button>
    </div>
    
    <!-- Video Player -->
    <div class="aspect-video w-full">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&widgetid=1`}
        title={title}
        class="w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  </div>
</div> 