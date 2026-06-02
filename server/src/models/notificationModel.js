import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const notificationsFile = path.join(process.cwd(), 'data', 'notifications.json');

const initDb = () => {
  const dir = path.dirname(notificationsFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(notificationsFile)) {
    fs.writeFileSync(notificationsFile, JSON.stringify([]));
  }
};

const readNotifications = () => {
  initDb();
  try {
    const data = fs.readFileSync(notificationsFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading notifications database file:', error);
    return [];
  }
};

const writeNotifications = (notifications) => {
  initDb();
  try {
    fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2));
  } catch (error) {
    console.error('Error writing to notifications database file:', error);
  }
};

export const Notification = {
  create: async ({ userId, title, message, type }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();
    const newNotification = {
      userId,
      title,
      message,
      type: type || 'system',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    if (db) {
      const doc = { _id: id, ...newNotification };
      await db.collection('notifications').insertOne(doc);
      return { id, ...newNotification };
    } else {
      const notifications = readNotifications();
      const doc = { id, ...newNotification };
      notifications.push(doc);
      writeNotifications(notifications);
      return doc;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('notifications').find({ userId }).toArray();
      return list.map(item => {
        const { _id: id, ...rest } = item;
        return { id, ...rest };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const notifications = readNotifications();
      return notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  markAsRead: async (notificationId) => {
    const db = getDb();
    if (db) {
      await db.collection('notifications').updateOne(
        { _id: notificationId },
        { $set: { isRead: true } }
      );
      const doc = await db.collection('notifications').findOne({ _id: notificationId });
      if (!doc) return null;
      const { _id: nid, ...rest } = doc;
      return { id: nid, ...rest };
    } else {
      const notifications = readNotifications();
      const idx = notifications.findIndex(n => n.id === notificationId);
      if (idx === -1) return null;
      notifications[idx].isRead = true;
      writeNotifications(notifications);
      return notifications[idx];
    }
  },

  markAllAsRead: async (userId) => {
    const db = getDb();
    if (db) {
      await db.collection('notifications').updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
      );
      return true;
    } else {
      const notifications = readNotifications();
      const updated = notifications.map(n => {
        if (n.userId === userId) {
          return { ...n, isRead: true };
        }
        return n;
      });
      writeNotifications(updated);
      return true;
    }
  }
};
