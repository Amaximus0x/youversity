<script lang="ts">
  import ProfileTab from "./components/ProfileTab.svelte";
  import ThemeTab from "./components/ThemeTab.svelte";
  import AppInfoTab from "./components/AppInfoTab.svelte";
  import ContactTab from "./components/ContactTab.svelte";

  // Define available tabs with both mobile and desktop labels
  const tabs = [
    { 
      id: 'profile', 
      label: 'Profile',
      mobileLabel: 'Profile',
      component: ProfileTab
    },
    { 
      id: 'theme', 
      label: 'Theme',
      mobileLabel: 'Theme',
      component: ThemeTab
    },
    { 
      id: 'app-info', 
      label: 'App Information',
      mobileLabel: 'App Info',
      component: AppInfoTab
    },
    { 
      id: 'contact', 
      label: 'Contact support',
      mobileLabel: 'Contact Info',
      component: ContactTab
    }
  ];

  // Active tab state
  let activeTab = 'profile';

  // Handle tab change
  function handleTabChange(tabId: string) {
    activeTab = tabId;
  }
</script>

<div class="w-full min-h-screen">
 

  <!--  Header -->
  <div class="w-full px-5 py-4">
    <h1 class="text-h2-mobile leading-[32px] lg:text-h2 text-light-text-primary dark:text-dark-text-primary">
      Settings
    </h1>
  </div>

  <!-- Tabs Navigation -->
  <div class="w-full overflow-x-auto scrollbar-hide">

      <div class="flex gap-4 min-w-max">
        {#each tabs as tab}
          <button
            class="relative px-4 py-4 whitespace-nowrap transition-colors"
            class:text-body-semibold={activeTab === tab.id}
            class:text-body={activeTab !== tab.id}
            class:text-brand-navy={activeTab === tab.id}
            class:text-light-text-tertiary={activeTab !== tab.id}
            class:dark:text-brand-turquoise={activeTab == tab.id}
            class:dark:text-Grey3={activeTab !== tab.id}
            on:click={() => handleTabChange(tab.id)}
          >
            <!-- Mobile label -->
            <span class="lg:hidden">
              {tab.mobileLabel}
            </span>
            <!-- Desktop label -->
            <span class="hidden lg:inline">
              {tab.label}
            </span>
            {#if activeTab === tab.id}
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-navy dark:bg-brand-turquoise"></div>
            {/if}
          </button>
        {/each}
      </div>
  </div>

  <!-- Tab Content -->
  <div class="py-6">
    {#each tabs as tab}
      {#if activeTab === tab.id}
        <svelte:component this={tab.component} />
      {/if}
    {/each}
  </div>
</div>

<style>
  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
