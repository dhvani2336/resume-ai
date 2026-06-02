import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const errorFile = path.join(process.cwd(), 'data', 'error_logs.json');

const initDb = () => {
  const dir = path.dirname(errorFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(errorFile)) {
    fs.writeFileSync(errorFile, JSON.stringify([]));
  }
};

const readLogs = () => {
  initDb();
  try {
    const data = fs.readFileSync(errorFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading error database file:', error);
    return [];
  }
};

const writeLogs = (logs) => {
  initDb();
  try {
    fs.writeFileSync(errorFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing to error database file:', error);
  }
};

export const ErrorLog = {
  create: async ({ message, stack, path: reqPath, method, userId }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();
    const newLog = {
      message,
      stack: stack || '',
      path: reqPath || '',
      method: method || '',
      userId: userId || 'Unauthenticated',
      timestamp: new Date().toISOString()
    };

    if (db) {
      const doc = { _id: id, ...newLog };
      await db.collection('error_logs').insertOne(doc);
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
      const list = await db.collection('error_logs')
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
  }
};
