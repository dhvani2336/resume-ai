import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const analysesFile = path.join(process.cwd(), 'data', 'analyses.json');

const initDb = () => {
  const dir = path.dirname(analysesFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(analysesFile)) {
    fs.writeFileSync(analysesFile, JSON.stringify([]));
  }
};

const readAnalyses = () => {
  initDb();
  try {
    const data = fs.readFileSync(analysesFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading analyses database file:', error);
    return [];
  }
};

const writeAnalyses = (analyses) => {
  initDb();
  try {
    fs.writeFileSync(analysesFile, JSON.stringify(analyses, null, 2));
  } catch (error) {
    console.error('Error writing to analyses database file:', error);
  }
};

export const Analysis = {
  create: async ({ userId, originalname, filename, size, atsScore, strengths, weaknesses, missingSkills, suggestions }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();

    if (db) {
      const newAnalysis = {
        _id: id,
        userId,
        originalname,
        filename,
        size,
        atsScore,
        strengths,
        weaknesses,
        missingSkills,
        suggestions,
        createdAt: new Date().toISOString()
      };
      await db.collection('analyses').insertOne(newAnalysis);
      const { _id: aid, ...rest } = newAnalysis;
      return { id: aid, ...rest };
    } else {
      const analyses = readAnalyses();
      const newAnalysis = {
        id,
        userId,
        originalname,
        filename,
        size,
        atsScore,
        strengths,
        weaknesses,
        missingSkills,
        suggestions,
        createdAt: new Date().toISOString()
      };
      analyses.push(newAnalysis);
      writeAnalyses(analyses);
      return newAnalysis;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('analyses').find({ userId }).toArray();
      return list
        .map(a => {
          const { _id: id, ...rest } = a;
          return { id, ...rest };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const analyses = readAnalyses();
      return analyses
        .filter(a => a.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('analyses').findOne({ _id: id });
      if (!doc) return null;
      const { _id: aid, ...rest } = doc;
      return { id: aid, ...rest };
    } else {
      const analyses = readAnalyses();
      return analyses.find(a => a.id === id) || null;
    }
  },

  updateById: async (id, updates) => {
    const db = getDb();
    if (db) {
      const { id: _, _id: __, ...fields } = updates;
      await db.collection('analyses').updateOne({ _id: id }, { $set: fields });
      const doc = await db.collection('analyses').findOne({ _id: id });
      if (!doc) return null;
      const { _id: aid, ...rest } = doc;
      return { id: aid, ...rest };
    } else {
      const analyses = readAnalyses();
      const idx = analyses.findIndex(a => a.id === id);
      if (idx === -1) return null;
      
      const { id: _, ...fields } = updates;
      analyses[idx] = { ...analyses[idx], ...fields };
      writeAnalyses(analyses);
      return analyses[idx];
    }
  },

  findByWorkspaceId: async (workspaceId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('analyses').find({ workspaceId }).toArray();
      return list.map(a => {
        const { _id: id, ...rest } = a;
        return { id, ...rest };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const analyses = readAnalyses();
      return analyses
        .filter(a => a.workspaceId === workspaceId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findByShareToken: async (token) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('analyses').findOne({ shareToken: token });
      if (!doc) return null;
      const { _id: id, ...rest } = doc;
      return { id, ...rest };
    } else {
      const analyses = readAnalyses();
      return analyses.find(a => a.shareToken === token) || null;
    }
  },

  deleteById: async (id) => {
    const db = getDb();
    if (db) {
      await db.collection('analyses').deleteOne({ _id: id });
      return true;
    } else {
      const analyses = readAnalyses();
      const filtered = analyses.filter(a => a.id !== id);
      writeAnalyses(filtered);
      return true;
    }
  }
};
