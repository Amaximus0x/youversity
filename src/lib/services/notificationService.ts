import { db } from '$lib/firebase';
import type { Notification } from '$lib/types/notification';
import { NotificationType } from '$lib/types/notification';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

export class NotificationService {
  private static COLLECTION = 'notifications';

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
} 