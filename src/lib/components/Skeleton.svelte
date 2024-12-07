<script>
  export let width = "100%";
  export let height = "20px";
  export let borderRadius = "4px";
</script>

<div
  class="skeleton-loader"
  style="width: {width}; height: {height}; border-radius: {borderRadius};"
/>

<style>
  .skeleton-loader {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style> 