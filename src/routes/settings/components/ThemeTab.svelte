<script lang="ts">
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
</script>

<div class="max-w-[632px]">
  <div class="p-6 rounded-2xl border border-light-border dark:border-dark-border">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
          Theme
        </h3>
        <p class="text-light-text-secondary dark:text-dark-text-secondary text-sm">
          Choose your preferred theme
        </p>
      </div>
      <div class="relative w-12 h-12 flex items-center justify-center border border-light-border dark:border-dark-border rounded-full">
        <ThemeToggle />
      </div>
    </div>
  </div>
</div> 