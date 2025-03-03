<!-- Notification Modal -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { notifications } from '$lib/stores/notificationStore';
  import type { Notification } from '$lib/types/notification';
  import { formatDistanceToNow } from 'date-fns';
  import { goto } from '$app/navigation';
  import { NotificationType } from '$lib/types/notification';
  import { page } from '$app/stores';

  const dispatch = createEventDispatcher();

  export let show = false;
  let selectedId: string | null = null;

  function close() {
    show = false;
    selectedId = null;
    dispatch('close');
  }

  $: if (!show) {
    selectedId = null;
  }

  function formatDate(date: Date) {
    return formatDistanceToNow(date, { 
      addSuffix: true,
      includeSeconds: false
    }).replace(/^about\s/i, '');
  }

  async function handleNotificationClick(notification: Notification) {
    selectedId = notification.id;
    if (!notification.isRead) {
      await notifications.markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.type === NotificationType.GENERAL) {
      // Close modal first to prevent any UI glitches
      close();
      
      // Handle different general notifications
      if (notification.title.includes('Welcome') || notification.title.includes('Create Your First Course')) {
        // If already on home page, dispatch focus event
        if ($page.url.pathname === '/') {
          dispatch('focusCourseObjective');
        } else {
          // Navigate to home page and focus on course objective input
          await goto('/?focus=courseObjective');
        }
      }
    } else if (notification.courseId) {
      let hash = '';
      
      // Add specific section anchors based on notification type
      if (notification.type === NotificationType.COURSE_LIKED) {
        hash = '';
      } else if (notification.type === NotificationType.COURSE_REVIEWED) {
        hash = '#reviews';
      }

      // Navigate to the course page with the appropriate section hash
      await goto(`/course/${notification.courseId}${hash}`);
      close();
    }
  }

  async function markAllAsRead() {
    const unreadNotifications = $notifications.filter(n => !n.isRead);
    for (const notification of unreadNotifications) {
      await notifications.markAsRead(notification.id);
    }
  }
</script>

{#if show}
  <div 
    class="absolute top-full right-0 mt-2 z-50 w-[400px] max-h-[480px] bg-white dark:bg-dark-bg-primary rounded-2xl shadow-lg border border-light-border dark:border-dark-border"
  >
    <div class="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border">
      <h2 class="text-h4-medium font-semibold text-light-text-primary dark:text-dark-text-primary">
        Notifications
      </h2>
      <div class="flex items-center gap-4">
        <button 
          class="text-brand-red text-semi-body hover:opacity-80 transition-opacity"
          on:click={markAllAsRead}
        >
          Mark all as read
        </button>
        
      </div>
    </div>

    <div class="overflow-y-auto max-h-[400px] p-4 space-y-4">
      {#each $notifications as notification}
        <div
          class="p-4 rounded-lg cursor-pointer transition-colors duration-200 border
            {selectedId === notification.id ? 'border-brand-red' : 'border-light-border dark:border-dark-border'}
            
            hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
          on:click={() => handleNotificationClick(notification)}
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 mt-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="6" fill={notification.isRead ? "rgba(0,0,0,0.05)" : "#EE434A"}/>
              </svg>
            </div>
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4">
                <h3 class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary">
                  {notification.title}
                </h3>
                <span class="text-sm-button text-light-text-tertiary dark:text-dark-text-tertiary whitespace-nowrap">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
              <p class="text-mini-body text-light-text-secondary dark:text-dark-text-secondary mt-1">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center py-8 text-light-text-tertiary dark:text-dark-text-tertiary">
          Empty notification
        </div>
      {/each}
    </div>
  </div>
{/if} 