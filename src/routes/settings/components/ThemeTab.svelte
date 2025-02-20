<script lang="ts">
  import { theme } from '$lib/stores/theme';

  type ThemeOption = 'light' | 'dark' | 'auto';
  let selectedTheme: ThemeOption = $theme;

  function handleThemeChange(newTheme: ThemeOption) {
    selectedTheme = newTheme;
    if (newTheme === 'auto') {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.set(isDark ? 'dark' : 'light');
    } else {
      theme.set(newTheme);
    }
  }
</script>

<div class="max-w-[632px]">
  <h2 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-4">Interface Theme</h2>
  <p class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary mb-6">
    Customize your workspace theme for smooth learning experience
  </p>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Dark Theme Card -->
    <button
      class="relative rounded-2xl border-2 transition-all duration-200 hover:border-brand-red
      {selectedTheme === 'dark' ? 'border-brand-red' : 'border-light-border dark:border-dark-border'}"
      on:click={() => handleThemeChange('dark')}
    >
      <div class="pl-[58px] pt-[39px] mr-[0px] border-b border-Grey">
      <img 
        src="/images/MobileDarkTheme.png" 
        alt="Dark Theme Preview" 
        class="w-full rounded-tl-lg mb-3 md:hidden"
      />
      <img 
        src="/images/DarkTheme.png" 
        alt="Dark Theme Preview" 
        class="w-full rounded-lg mb-3 hidden md:block"
      />
  </div>
      <div class="flex items-center justify-between">
        <span class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary">
          Dark Theme
        </span>
        {#if selectedTheme === 'dark'}
          <img 
            src="/images/checkmark-circle-01.svg" 
            alt="Selected" 
            class="w-6 h-6"
            style="filter: invert(36%) sepia(71%) saturate(2611%) hue-rotate(334deg) brightness(97%) contrast(90%);"
          />
        {/if}
      </div>
    </button>

    <!-- Light Theme Card -->
    <button
      class="relative p-4 rounded-2xl border-2 transition-all duration-200 hover:border-brand-red
      {selectedTheme === 'light' ? 'border-brand-red' : 'border-light-border dark:border-dark-border'}"
      on:click={() => handleThemeChange('light')}
    >
      <img 
        src="/images/MobileLightTheme.png" 
        alt="Light Theme Preview" 
        class="w-full rounded-lg mb-3"
      />
      <div class="flex items-center justify-between">
        <span class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary">
          Light Theme
        </span>
        {#if selectedTheme === 'light'}
          <img 
            src="/images/checkmark-circle-01.svg" 
            alt="Selected" 
            class="w-6 h-6"
            style="filter: invert(36%) sepia(71%) saturate(2611%) hue-rotate(334deg) brightness(97%) contrast(90%);"
          />
        {/if}
      </div>
    </button>

    <!-- Auto Theme Card -->
    <button
      class="relative p-4 rounded-2xl border-2 transition-all duration-200 hover:border-brand-red
      {selectedTheme === 'auto' ? 'border-brand-red' : 'border-light-border dark:border-dark-border'}"
      on:click={() => handleThemeChange('auto')}
    >
      <img 
        src="/images/MobileAutoTheme.png" 
        alt="Auto Theme Preview" 
        class="w-full rounded-lg mb-3"
      />
      <div class="flex items-center justify-between">
        <span class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary">
          Auto
        </span>
        {#if selectedTheme === 'auto'}
          <img 
            src="/images/checkmark-circle-01.svg" 
            alt="Selected" 
            class="w-6 h-6"
            style="filter: invert(36%) sepia(71%) saturate(2611%) hue-rotate(334deg) brightness(97%) contrast(90%);"
          />
        {/if}
      </div>
    </button>
  </div>
</div>

<style>
  /* Add hover effect for cards */
  button:hover {
    transform: translateY(-2px);
  }
</style> 