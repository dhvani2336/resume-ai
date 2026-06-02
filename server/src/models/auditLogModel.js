import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const auditFile = path.join(process.cwd(), 'data', 'audit_logs.json');

const initDb = () => {
  const dir = path.dirname(auditFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(auditFile)) {
    fs.writeFileSync(auditFile, JSON.stringify([]));
  }
};

const readLogs = () => {
  initDb();
  try {
    const data = fs.readFileSync(auditFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading audit database file:', error);
    return [];
  }
};

const writeLogs = (logs) => {
  initDb();
  try {
    fs.writeFileSync(auditFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing to audit database file:', error);
  }
};

export const AuditLog = {
  create: async ({ userId, userName, action, ipAddress, userAgent }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();
    const newLog = {
      userId,
      userName: userName || 'Anonymous',
      action,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: new Date().toISOString()
    };

    if (db) {
      const doc = { _id: id, ...newLog };
      await db.collection('audit_logs').insertOne(doc);
      return { id, ...newLog };
    } else {
      const logs = readLogs();
      const doc = { id, ...newLog };
      logs.push(doc);
      writeLogs(logs);
      return doc;
    }
  },

  findRecent: async (limit = 100) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('audit_logs')
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return list.map(item => {
        const { _id: id, ...rest } = item;
        return { id, ...rest };
      });
    } else {
      const logs = readLogs();
      return logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('audit_logs')
        .find({ userId })
        .sort({ timestamp: -1 })
        .toArray();
      return list.map(item => {
        const { _id: id, ...rest } = item;
        return { id, ...rest };
      });
    } else {
      const logs = readLogs();
      return logs
        .filter(l => l.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  }
};
