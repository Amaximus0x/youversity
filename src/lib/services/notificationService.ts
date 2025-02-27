import { db } from '$lib/firebase';
import type { Notification } from '$lib/types/notification';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';

export class NotificationService {
  private static COLLECTION = 'notifications';

  static async createNotification(notification: Omit<Notification, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.COLLECTION), {
      ...notification,
      createdAt: new Date(),
      isRead: false
    });
    return docRef.id;
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Notification[];
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
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Notification[];
      callback(notifications);
    });
  }
} 