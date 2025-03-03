import { db } from '$lib/firebase';
import type { Notification } from '$lib/types/notification';
import { NotificationType, SystemAnnouncementCategory } from '$lib/types/notification';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, onSnapshot, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';

export class NotificationService {
  private static COLLECTION = 'notifications';
  private static USERS_COLLECTION = 'users';

  static async createWelcomeNotification(userId: string): Promise<string> {
    const welcomeNotification = {
      userId,
      title: 'Welcome to Youversity! 🎉',
      message: 'Welcome to Youversity! Start your journey toward smarter learning today.',
      type: NotificationType.GENERAL,
      isRead: false,
      createdAt: new Date()
    };

    return this.createNotification(welcomeNotification);
  }

  static async createFirstCourseNotification(userId: string): Promise<string> {
    const firstCourseNotification = {
      userId,
      title: 'Create Your First Course',
      message: 'Kickstart your experience. create your first course now and share your passion.',
      type: NotificationType.GENERAL,
      isRead: false,
      createdAt: new Date()
    };

    return this.createNotification(firstCourseNotification);
  }

  static async createNotification(notification: Omit<Notification, 'id'>): Promise<string> {
    try {
      const notificationsRef = collection(db, this.COLLECTION);
      const docRef = await addDoc(notificationsRef, {
        ...notification,
        createdAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
      } as Notification;
    });
  }

  static async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, this.COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  }

  static subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
        } as Notification;
      });
      callback(notifications);
    });
  }

  static async createSystemAnnouncement(
    title: string,
    message: string,
    category: SystemAnnouncementCategory
  ): Promise<void> {
    try {
      // Get all users
      const usersSnapshot = await getDocs(collection(db, this.USERS_COLLECTION));
      const batch = writeBatch(db);
      
      // Create notification for each user
      usersSnapshot.forEach((userDoc) => {
        const notificationRef = doc(collection(db, this.COLLECTION));
        batch.set(notificationRef, {
          userId: userDoc.id,
          title,
          message,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          isRead: false,
          createdAt: serverTimestamp(),
          isSystemWide: true,
          category
        });
      });

      // Commit the batch
      await batch.commit();
      console.log('System announcement sent to all users');
    } catch (error) {
      console.error('Error creating system announcement:', error);
      throw error;
    }
  }

  // Helper method to send feature announcement
  static async announceNewFeature(title: string, message: string): Promise<void> {
    return this.createSystemAnnouncement(
      title,
      message,
      SystemAnnouncementCategory.NEW_FEATURES
    );
  }

  // Helper method to send tips
  static async sendTip(title: string, message: string): Promise<void> {
    return this.createSystemAnnouncement(
      title,
      message,
      SystemAnnouncementCategory.TIPS
    );
  }

  // Helper method to send maintenance notifications
  static async announceMaintenance(title: string, message: string): Promise<void> {
    return this.createSystemAnnouncement(
      title,
      message,
      SystemAnnouncementCategory.MAINTENANCE
    );
  }

  // Helper method to send general updates
  static async sendUpdate(title: string, message: string): Promise<void> {
    return this.createSystemAnnouncement(
      title,
      message,
      SystemAnnouncementCategory.UPDATES
    );
  }
} 