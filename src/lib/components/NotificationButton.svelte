<!-- Notification Button -->
<script lang="ts">
  import { notifications } from '$lib/stores/notificationStore';
  import NotificationModal from './modals/NotificationModal.svelte';
  import { auth } from '$lib/firebase';
  import { onMount, createEventDispatcher } from 'svelte';
  import { clickOutside } from '$lib/actions/clickOutside';

  declare namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:click_outside'?: (event: CustomEvent) => void;
    }
  }

  const dispatch = createEventDispatcher();

  let showNotifications = false;
  let unreadCount = 0;
  let unsubscribeNotifications: (() => void) | null = null;

  // Calculate unread count whenever notifications change
  $: if ($notifications) {
    unreadCount = $notifications.filter(n => !n.isRead).length;
  }

  onMount(() => {
    // Initialize notifications if user is already logged in
    const user = auth.currentUser;
    if (user) {
      unsubscribeNotifications = notifications.init(user.uid);
    }

    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  });

  function handleClickOutside() {
    showNotifications = false;
    dispatch('close');
  }
</script>

<div 
  class="relative inline-flex items-center justify-center"
  use:clickOutside
  on:click_outside={handleClickOutside}
>
  <button
    class="relative flex items-center justify-center w-6 h-6 transition-colors hover:opacity-80"
    on:click={() => showNotifications = !showNotifications}
    aria-label="Notifications"
  >
  
    <!-- <svg
      class="w-6 h-6 text-light-text-primary dark:text-dark-text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg> -->

    {#if unreadCount === 0 || unreadCount === null}
      <!-- <span
        class="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-sm-button text-white bg-brand-red rounded-full px-1"
      >
        {unreadCount}
      </span> -->
      <img src="/icons/notification-block-02.svg" alt="Notifications" class="w-6 h-6 text-light-text-primary dark:text-dark-text-primary" />
    {:else}
      <img src="/icons/notification-active.svg" alt="Notifications" class="w-6 h-6 text-light-text-primary dark:text-dark-text-primary" />
    {/if}
  </button>

  <NotificationModal
    bind:show={showNotifications}
    on:close={() => showNotifications = false}
  />
</div> 