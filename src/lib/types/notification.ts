export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  COURSE_CREATED = 'COURSE_CREATED',
  COURSE_UPDATED = 'COURSE_UPDATED',
  COURSE_DELETED = 'COURSE_DELETED',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  SYSTEM = 'SYSTEM',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  GENERAL = 'GENERAL'
} 