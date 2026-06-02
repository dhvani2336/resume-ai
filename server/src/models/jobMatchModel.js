import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const jobMatchesFile = path.join(process.cwd(), 'data', 'jobmatches.json');

const initDb = () => {
  const dir = path.dirname(jobMatchesFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(jobMatchesFile)) {
    fs.writeFileSync(jobMatchesFile, JSON.stringify([]));
  }
};

const readJobMatches = () => {
  initDb();
  try {
    const data = fs.readFileSync(jobMatchesFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading job matches database file:', error);
    return [];
  }
};

const writeJobMatches = (matches) => {
  initDb();
  try {
    fs.writeFileSync(jobMatchesFile, JSON.stringify(matches, null, 2));
  } catch (error) {
    console.error('Error writing to job matches database file:', error);
  }
};

export const JobMatch = {
  create: async ({ userId, resumeId, originalname, jobDescription, matchScore, matchingSkills, missingKeywords, strengths, improvementSuggestions }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();

    if (db) {
      const newMatch = {
        _id: id,
        userId,
        resumeId,
        originalname,
        jobDescription,
        matchScore,
        matchingSkills,
        missingKeywords,
        strengths,
        improvementSuggestions,
        createdAt: new Date().toISOString()
      };
      await db.collection('jobmatches').insertOne(newMatch);
      const { _id: jmid, ...rest } = newMatch;
      return { id: jmid, ...rest };
    } else {
      const matches = readJobMatches();
      const newMatch = {
        id,
        userId,
        resumeId,
        originalname,
        jobDescription,
        matchScore,
        matchingSkills,
        missingKeywords,
        strengths,
        improvementSuggestions,
        createdAt: new Date().toISOString()
      };
      matches.push(newMatch);
      writeJobMatches(matches);
      return newMatch;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('jobmatches').find({ userId }).toArray();
      return list
        .map(m => {
          const { _id: id, ...rest } = m;
          return { id, ...rest };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const matches = readJobMatches();
      return matches
        .filter(m => m.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('jobmatches').findOne({ _id: id });
      if (!doc) return null;
      const { _id: jmid, ...rest } = doc;
      return { id: jmid, ...rest };
    } else {
      const matches = readJobMatches();
      return matches.find(m => m.id === id) || null;
    }
  },

  updateById: async (id, updates) => {
    const db = getDb();
    if (db) {
      const { id: _, _id: __, ...fields } = updates;
      await db.collection('jobmatches').updateOne({ _id: id }, { $set: fields });
      const doc = await db.collection('jobmatches').findOne({ _id: id });
      if (!doc) return null;
      const { _id: jmid, ...rest } = doc;
      return { id: jmid, ...rest };
    } else {
      const matches = readJobMatches();
      const idx = matches.findIndex(m => m.id === id);
      if (idx === -1) return null;
      
      const { id: _, ...fields } = updates;
      matches[idx] = { ...matches[idx], ...fields };
      writeJobMatches(matches);
      return matches[idx];
    }
  },

  findByShareToken: async (token) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('jobmatches').findOne({ shareToken: token });
      if (!doc) return null;
      const { _id: id, ...rest } = doc;
      return { id, ...rest };
    } else {
      const matches = readJobMatches();
      return matches.find(m => m.shareToken === token) || null;
    }
  }
};
