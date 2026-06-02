import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const linkedinFile = path.join(process.cwd(), 'data', 'linkedin_profiles.json');

const initDb = () => {
  const dir = path.dirname(linkedinFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(linkedinFile)) {
    fs.writeFileSync(linkedinFile, JSON.stringify([]));
  }
};

const readProfiles = () => {
  initDb();
  try {
    const data = fs.readFileSync(linkedinFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading linkedin database file:', error);
    return [];
  }
};

const writeProfiles = (profiles) => {
  initDb();
  try {
    fs.writeFileSync(linkedinFile, JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error('Error writing to linkedin database file:', error);
  }
};

export const LinkedInProfile = {
  create: async ({ userId, resumeId, headline, about, experience, skills }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();
    const newProfile = {
      userId,
      resumeId,
      headline,
      about,
      experience,
      skills,
      createdAt: new Date().toISOString()
    };

    if (db) {
      const doc = { _id: id, ...newProfile };
      await db.collection('linkedin_profiles').insertOne(doc);
      return { id, ...newProfile };
    } else {
      const profiles = readProfiles();
      const doc = { id, ...newProfile };
      profiles.push(doc);
      writeProfiles(profiles);
      return doc;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('linkedin_profiles').find({ userId }).toArray();
      return list.map(item => {
        const { _id: id, ...rest } = item;
        return { id, ...rest };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const profiles = readProfiles();
      return profiles
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('linkedin_profiles').findOne({ _id: id });
      if (!doc) return null;
      const { _id: lpid, ...rest } = doc;
      return { id: lpid, ...rest };
    } else {
      const profiles = readProfiles();
      return profiles.find(p => p.id === id) || null;
    }
  }
};
