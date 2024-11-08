<script lang="ts">
  export let videoId: string;
  export let onClose: () => void;
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown}/>

<div 
  class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
  on:click={onClose}
  on:keydown={(e) => e.key === 'Escape' && onClose()}
  role="dialog"
  aria-modal="true"
>
  <div 
    class="relative w-full max-w-4xl aspect-video"
    on:click|stopPropagation
    role="presentation"
  >
    <button
      class="absolute -top-10 right-0 text-white hover:text-gray-300"
      on:click={onClose}
    >
      Close
    </button>
    <iframe
      title="YouTube video player"
      src={`https://www.youtube.com/embed/${videoId}`}
      class="w-full h-full"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
</div> 