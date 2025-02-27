import { writable } from 'svelte/store';
import type { Notification } from '$lib/types/notification';
import { NotificationService } from '$lib/services/notificationService';
import { auth } from '$lib/firebase';

function createNotificationStore() {
  const { subscribe, set, update } = writable<Notification[]>([]);

  return {
    subscribe,
    init: (userId: string) => {
      return NotificationService.subscribeToUserNotifications(userId, (notifications) => {
        set(notifications);
      });
    },
    markAsRead: async (notificationId: string) => {
      await NotificationService.markAsRead(notificationId);
    },
    getUnreadCount: (notifications: Notification[]) => {
      return notifications.filter(n => !n.isRead).length;
    }
  };
}

export const notifications = createNotificationStore(); 