<!-- Notification Button -->
<script lang="ts">
  import { notifications } from '$lib/stores/notificationStore';
  import NotificationModal from './modals/NotificationModal.svelte';
  import { auth } from '$lib/firebase';
  import { onMount, createEventDispatcher } from 'svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  import { goto } from '$app/navigation';

  declare namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:click_outside'?: (event: CustomEvent) => void;
    }
  }

  const dispatch = createEventDispatcher();

  let showNotifications = false;
  let unreadCount = 0;
  let unsubscribeNotifications: (() => void) | null = null;
  let isMobile = false;

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

    // Check if mobile
    isMobile = window.innerWidth < 1024;
    const handleResize = () => {
      isMobile = window.innerWidth < 1024;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
      window.removeEventListener('resize', handleResize);
    };
  });

  function handleClickOutside() {
    showNotifications = false;
    dispatch('close');
  }

  function handleNotificationClick() {
    if (isMobile) {
      goto('/notifications');
    } else {
      showNotifications = !showNotifications;
    }
  }
</script>

<div 
  class="relative inline-flex items-center justify-center"
  use:clickOutside
  on:click_outside={handleClickOutside}
>
  <button
    class="relative flex items-center justify-center w-6 h-6 transition-colors hover:opacity-80"
    on:click={handleNotificationClick}
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
      <img src="/icons/notification-block-02.svg" alt="Notifications" class="w-6 h-6 opacity-60 dark:opacity-100 dark:invert dark:brightness-200" />
    {:else}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
        <path d="M14.5 2.42385C13.7178 2.14933 12.8764 2 12 2C7.84413 2 4.47513 5.35786 4.47513 9.5C4.47503 10.5718 4.41272 11.5793 3.78561 12.5029C3.30684 13.1995 2.66061 13.9129 2.52992 14.7696C2.31727 16.1636 3.268 17.1312 4.43205 17.6134C8.89481 19.4622 15.1052 19.4622 19.5679 17.6134C20.732 17.1312 21.6827 16.1636 21.4701 14.7696C21.3702 14.1149 20.9692 13.5438 20.5719 13" class="stroke-light-text-secondary dark:stroke-dark-text-secondary" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 19C8.45849 20.7252 10.0755 22 12 22C13.9245 22 15.5415 20.7252 16 19" class="stroke-light-text-secondary dark:stroke-dark-text-secondary" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 7.5C21 5.567 19.433 4 17.5 4C15.567 4 14 5.567 14 7.5C14 9.433 15.567 11 17.5 11C19.433 11 21 9.433 21 7.5Z" fill="#EB434A" stroke="#EB434A" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    {/if}
  </button>

  {#if !isMobile}
    <NotificationModal
      bind:show={showNotifications}
      on:close={() => showNotifications = false}
      on:focusCourseObjective
    />
  {/if}
</div> 