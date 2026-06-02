import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const lettersFile = path.join(process.cwd(), 'data', 'cover_letters.json');

const initDb = () => {
  const dir = path.dirname(lettersFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(lettersFile)) {
    fs.writeFileSync(lettersFile, JSON.stringify([]));
  }
};

const readLetters = () => {
  initDb();
  try {
    const data = fs.readFileSync(lettersFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading letters database file:', error);
    return [];
  }
};

const writeLetters = (letters) => {
  initDb();
  try {
    fs.writeFileSync(lettersFile, JSON.stringify(letters, null, 2));
  } catch (error) {
    console.error('Error writing to letters database file:', error);
  }
};

export const CoverLetter = {
  create: async ({ userId, resumeId, jobTitle, company, jobDescription, content }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();
    const newLetter = {
      userId,
      resumeId,
      jobTitle,
      company,
      jobDescription,
      content,
      createdAt: new Date().toISOString()
    };

    if (db) {
      const doc = { _id: id, ...newLetter };
      await db.collection('cover_letters').insertOne(doc);
      return { id, ...newLetter };
    } else {
      const letters = readLetters();
      const doc = { id, ...newLetter };
      letters.push(doc);
      writeLetters(letters);
      return doc;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('cover_letters').find({ userId }).toArray();
      return list.map(item => {
        const { _id: id, ...rest } = item;
        return { id, ...rest };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const letters = readLetters();
      return letters
        .filter(l => l.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('cover_letters').findOne({ _id: id });
      if (!doc) return null;
      const { _id: lid, ...rest } = doc;
      return { id: lid, ...rest };
    } else {
      const letters = readLetters();
      return letters.find(l => l.id === id) || null;
    }
  }
};
