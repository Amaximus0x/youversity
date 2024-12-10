<script lang="ts">
  import CourseGenerationProgress from './CourseGenerationProgress.svelte';
  import { loadingState } from '$lib/stores/loadingState';
</script>

{#if $loadingState.isLoading}
  <CourseGenerationProgress />
{/if} 