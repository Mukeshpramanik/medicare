import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { Notification } from '@/types';
import { generateId } from '@/lib/utils';

export class NotificationService {
  static getNotifications(): Notification[] {
    return localStorageAdapter.getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  static getNotificationsByUser(userId: string): Notification[] {
    const list = this.getNotifications();
    return list
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getUnreadCount(userId: string): number {
    return this.getNotificationsByUser(userId).filter((n) => !n.isRead).length;
  }

  static createNotification(
    data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
  ): Notification {
    const list = this.getNotifications();
    const newNotification: Notification = {
      ...data,
      id: generateId('notif'),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotification);
    localStorageAdapter.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    return newNotification;
  }

  static markAsRead(notificationId: string): boolean {
    const list = this.getNotifications();
    const target = list.find((n) => n.id === notificationId);
    if (!target) return false;
    target.isRead = true;
    localStorageAdapter.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    return true;
  }

  static markAllAsRead(userId: string): boolean {
    const list = this.getNotifications();
    let updated = false;
    list.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        updated = true;
      }
    });
    if (updated) {
      localStorageAdapter.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
    return true;
  }
}

