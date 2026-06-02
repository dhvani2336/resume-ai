import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const coachFile = path.join(process.cwd(), 'data', 'career_coaches.json');

const initDb = () => {
  const dir = path.dirname(coachFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(coachFile)) {
    fs.writeFileSync(coachFile, JSON.stringify([]));
  }
};

const readCoaches = () => {
  initDb();
  try {
    const data = fs.readFileSync(coachFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading coaches database file:', error);
    return [];
  }
};

const writeCoaches = (coaches) => {
  initDb();
  try {
    fs.writeFileSync(coachFile, JSON.stringify(coaches, null, 2));
  } catch (error) {
    console.error('Error writing to coaches database file:', error);
  }
};

export const CareerCoach = {
  create: async ({ userId, targetRole, experienceLevel, roadmap, skills, learningSuggestions }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();
    const newCoachRecord = {
      userId,
      targetRole,
      experienceLevel,
      roadmap,
      skills,
      learningSuggestions,
      createdAt: new Date().toISOString()
    };

    if (db) {
      const doc = { _id: id, ...newCoachRecord };
      await db.collection('career_coaches').insertOne(doc);
      return { id, ...newCoachRecord };
    } else {
      const coaches = readCoaches();
      const doc = { id, ...newCoachRecord };
      coaches.push(doc);
      writeCoaches(coaches);
      return doc;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('career_coaches').find({ userId }).toArray();
      return list.map(item => {
        const { _id: id, ...rest } = item;
        return { id, ...rest };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const coaches = readCoaches();
      return coaches
        .filter(c => c.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('career_coaches').findOne({ _id: id });
      if (!doc) return null;
      const { _id: cid, ...rest } = doc;
      return { id: cid, ...rest };
    } else {
      const coaches = readCoaches();
      return coaches.find(c => c.id === id) || null;
    }
  }
};
