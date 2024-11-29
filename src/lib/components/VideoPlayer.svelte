<script lang="ts">
  export let videoId: string;
  let className = '';
  export { className as class };
</script>

<div class={className}>
  <iframe
    src="https://www.youtube.com/embed/{videoId}?autoplay=1"
    title="YouTube video player"
    class="w-full h-full"
    style="min-height: 200px;"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>

<style>
  iframe {
    border-radius: 0.5rem 0.5rem 0 0;
  }
</style> 