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
  <h2 class="text-h2 font-[30px] text-light-text-primary dark:text-dark-text-primary mb-2">Interface Theme</h2>
  <p class="text-body text-light-text-tertiary dark:text-dark-text-tertiary mb-6">
    Customize your workspace theme for smooth learning experience
  </p>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Dark Theme Card -->
    <button
      class="relative rounded-2xl bg-Black/5 dark:bg-White/10 border transition-all duration-200 hover:border-brand-red
      {selectedTheme === 'dark' ? 'border-brand-red' : 'border-Grey dark:border-Grey3'}"
      on:click={() => handleThemeChange('dark')}
    >
      <div class="pl-[58px] pt-[39px] md:pl-[28px] md:pt-[28px] mr-[0px] border-b border-Grey">
        <!-- Mobile Image -->
      <img 
        src="/images/MobileDarkTheme.png" 
        alt="Dark Theme Preview" 
        class="w-full rounded-tl-lg md:hidden"
      />
      <!-- Desktop Image -->
      <img 
        src="/images/DarkTheme.png" 
        alt="Dark Theme Preview" 
        class="w-full rounded-tl-lg hidden md:block"
      />
  </div>
      <div class="pl-4 py-2 pr-2 flex items-center justify-between gap-2.5">
        <span class="{selectedTheme === 'dark' ? 'text-body-semibold' : 'text-body'} text-light-text-primary dark:text-dark-text-primary">
          Dark Theme
        </span>
        {#if selectedTheme === 'dark'}
          
          <img 
            src="/images/checkmark-circle-01.svg" 
            alt="Selected" 
            class="w-6 h-6"
            style="filter: invert(36%) sepia(71%) saturate(2611%) hue-rotate(334deg) brightness(97%) contrast(90%);"
          />
          {:else}
          <img 
            src="/images/checkmark-circle-01.svg" 
            alt="Selected" 
            class="w-6 h-6"
          />
        {/if}
      </div>
    </button>

    <!-- Light Theme Card -->
    <button
    class="relative rounded-2xl border transition-all bg-Black/5 dark:bg-White/10 duration-200 hover:border-brand-red
    {selectedTheme === 'light' ? 'border-brand-red' : 'border-Grey dark:border-Grey3'}"
    on:click={() => handleThemeChange('light')}
  >
    <div class="pl-[58px] pt-[39px] md:pl-[28px] md:pt-[28px] mr-[0px] border-b border-Grey">
      <!-- Mobile Image -->
    <img 
      src="/images/MobileLightTheme.png" 
      alt="Light Theme Preview" 
      class="w-full rounded-tl-lg md:hidden"
    />
    <!-- Desktop Image -->
    <img 
      src="/images/LightTheme.png" 
      alt="Light Theme Preview" 
      class="w-full rounded-tl-lg hidden md:block"
    />
</div>
    <div class="pl-4 py-2 pr-2 flex items-center justify-between gap-2.5">
      <span class="{selectedTheme === 'light' ? 'text-body-semibold' : 'text-body'} text-light-text-primary dark:text-dark-text-primary">
        Light Theme
      </span>
      {#if selectedTheme === 'light'}
        
        <img 
          src="/images/checkmark-circle-01.svg" 
          alt="Selected" 
          class="w-6 h-6"
          style="filter: invert(36%) sepia(71%) saturate(2611%) hue-rotate(334deg) brightness(97%) contrast(90%);"
        />
        {:else}
        <img 
          src="/images/checkmark-circle-01.svg" 
          alt="Selected" 
          class="w-6 h-6"
        />
      {/if}
    </div>
  </button>

    <!-- Auto Theme Card -->
    <button
    class="relative rounded-2xl border transition-all bg-Black/5 dark:bg-White/10 duration-200 hover:border-brand-red
    {selectedTheme === 'auto' ? 'border-brand-red' : 'border-Grey dark:border-Grey3'}"
    on:click={() => handleThemeChange('auto')}
  >
    <div class="pl-[58px] pt-[39px] md:pl-[28px] md:pt-[28px] mr-[0px] border-b border-Grey">
      <!-- Mobile Image -->
    <img 
      src="/images/MobileAutoTheme.png" 
      alt="Auto Theme Preview" 
      class="w-full rounded-tl-lg md:hidden"
    />
    <!-- Desktop Image -->
    <img 
      src="/images/AutoTheme.png" 
      alt="Auto Theme Preview" 
      class="w-full rounded-tl-lg hidden md:block"
    />
</div>
    <div class="pl-4 py-2 pr-2 flex items-center justify-between gap-2.5">
      <span class="{selectedTheme === 'auto' ? 'text-body-semibold' : 'text-body'} text-light-text-primary dark:text-dark-text-primary">
        Auto Theme
      </span>
      {#if selectedTheme === 'auto'}
        
        <img 
          src="/images/checkmark-circle-01.svg" 
          alt="Selected" 
          class="w-6 h-6"
          style="filter: invert(36%) sepia(71%) saturate(2611%) hue-rotate(334deg) brightness(97%) contrast(90%);"
        />
        {:else}
        <img 
          src="/images/checkmark-circle-01.svg" 
          alt="Selected" 
          class="w-6 h-6"
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