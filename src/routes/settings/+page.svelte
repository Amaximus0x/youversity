<script lang="ts">
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { user } from '$lib/stores/auth';
</script>

<div class="max-w-3xl mx-auto">
  <h1 class="text-4xl font-normal text-light-text-primary dark:text-dark-text-primary mb-8">Settings</h1>

  <!-- Theme Settings -->
  <div class="mb-8">
    <h2 class="text-2xl font-normal text-light-text-primary dark:text-dark-text-primary mb-4">Appearance</h2>
    <div class="p-6 rounded-2xl border border-light-border dark:border-dark-border">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Theme</h3>
          <p class="text-light-text-secondary dark:text-dark-text-secondary text-sm">Choose your preferred theme</p>
        </div>
        <div class="relative w-12 h-12 flex items-center justify-center border border-light-border dark:border-dark-border rounded-full">
          <ThemeToggle />
        </div>
      </div>
    </div>
  </div>

  <!-- Account Settings -->
  {#if $user}
    <div class="mb-8">
      <h2 class="text-2xl font-normal text-light-text-primary dark:text-dark-text-primary mb-4">Account</h2>
      <div class="p-6 rounded-2xl border border-light-border dark:border-dark-border">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-full overflow-hidden border border-light-border dark:border-dark-border">
            <img 
              src={$user.photoURL || ''} 
              alt={$user.displayName || 'User'} 
              class="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 class="text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{$user.displayName}</h3>
            <p class="text-light-text-secondary dark:text-dark-text-secondary text-sm">{$user.email}</p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Help & Support -->
  <div class="mb-8">
    <h2 class="text-2xl font-normal text-light-text-primary dark:text-dark-text-primary mb-4">Help & Support</h2>
    <div class="p-6 rounded-2xl border border-light-border dark:border-dark-border">
      <a 
        href="/help"
        class="flex items-center justify-between group"
      >
        <div>
          <h3 class="text-lg font-medium text-light-text-primary dark:text-dark-text-primary group-hover:text-brand-red transition-colors">Help Center</h3>
          <p class="text-light-text-secondary dark:text-dark-text-secondary text-sm">Get help with Youversity</p>
        </div>
        <img 
          src="/icons/arrow-right.svg" 
          alt="Go to help center" 
          class="w-6 h-6 opacity-60 group-hover:opacity-100 transition-opacity"
        />
      </a>
    </div>
  </div>
</div> 