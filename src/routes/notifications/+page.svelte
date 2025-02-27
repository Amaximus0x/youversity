<script lang="ts">
    import { notifications } from "$lib/stores/notificationStore";
    import { formatDistanceToNow } from "date-fns";
    import type { Notification } from "$lib/types/notification";
    import { goto } from "$app/navigation";

    let selectedId: string | null = null;

    function formatDate(date: Date) {
        return formatDistanceToNow(date, { addSuffix: true });
    }

    async function handleNotificationClick(notification: Notification) {
        selectedId = notification.id;
        if (!notification.isRead) {
            await notifications.markAsRead(notification.id);
        }
    }

    async function markAllAsRead() {
        const unreadNotifications = $notifications.filter((n) => !n.isRead);
        for (const notification of unreadNotifications) {
            await notifications.markAsRead(notification.id);
        }
    }
</script>

<div class="min-h-screen bg-gradient-light dark:bg-gradient-dark">
    <!-- Header -->
    <div
        class="fixed top-0 left-0 right-0 bg-light-bg-secondary dark:bg-dark-bg-secondary z-50"
    >
        <div
            class="flex items-center justify-between p-4 pb-2 border-b border-light-border dark:border-dark-border"
        >
            <div class="flex items-center gap-2">
                <button class="p-2" on:click={() => goto("/")}>
                    <img
                        src="/icons/arrow-left.svg"
                        alt="Back"
                        class="w-6 h-6"
                    />
                </button>
                <h1
                    class="text-h4-medium text-light-text-primary dark:text-dark-text-primary"
                >
                    Notifications
                </h1>
            </div>
            <button class="text-brand-red text-body" on:click={markAllAsRead}>
                Mark all as read
            </button>
        </div>
    </div>

    <!-- Notification List -->

    <div class="space-y-4">
        {#each $notifications as notification}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
                class="p-4 rounded-2xl cursor-pointer transition-colors duration-200 border
            {selectedId === notification.id
                    ? 'border-brand-red'
                    : 'border-light-border dark:border-dark-border'}"
                on:click={() => handleNotificationClick(notification)}
            >
                <div class="flex items-start justify-between gap-4">
                    <div class="flex items-center justify-center gap-2">
                        <div class="flex-shrink-0 mt-1">
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="6"
                                    cy="6"
                                    r="6"
                                    fill={notification.isRead
                                        ? "rgba(0,0,0,0.05)"
                                        : "#EE434A"}
                                />
                            </svg>
                        </div>

                        <h3
                            class="text-body-semibold text-light-text-primary dark:text-dark-text-primary"
                        >
                            {notification.title}
                        </h3>
                    </div>

                    <span
                        class="text-semi-body text-light-text-tertiary dark:text-dark-text-tertiary whitespace-nowrap"
                    >
                        {formatDate(notification.createdAt)}
                    </span>

                </div>
                <div class="flex-1 gap-2">
                    
                    <p
                        class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary mt-2"
                    >
                        {notification.message}
                    </p>
                </div>
            </div>
        {:else}
            <div
                class="text-center py-8 text-light-text-tertiary dark:text-dark-text-tertiary"
            >
                Empty notification
            </div>
        {/each}
    </div>
</div>
