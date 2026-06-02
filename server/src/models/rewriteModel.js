import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const rewritesFile = path.join(process.cwd(), 'data', 'rewrites.json');

const initDb = () => {
  const dir = path.dirname(rewritesFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(rewritesFile)) {
    fs.writeFileSync(rewritesFile, JSON.stringify([]));
  }
};

const readRewrites = () => {
  initDb();
  try {
    const data = fs.readFileSync(rewritesFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading rewrites database file:', error);
    return [];
  }
};

const writeRewrites = (rewrites) => {
  initDb();
  try {
    fs.writeFileSync(rewritesFile, JSON.stringify(rewrites, null, 2));
  } catch (error) {
    console.error('Error writing to rewrites database file:', error);
  }
};

export const Rewrite = {
  create: async ({ userId, resumeId, originalname, targetRole, originalContent, rewrittenContent, improvements, atsImpact }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();

    if (db) {
      const newRewrite = {
        _id: id,
        userId,
        resumeId,
        originalname,
        targetRole,
        originalContent,
        rewrittenContent,
        improvements,
        atsImpact,
        createdAt: new Date().toISOString()
      };
      await db.collection('rewrites').insertOne(newRewrite);
      const { _id: rwid, ...rest } = newRewrite;
      return { id: rwid, ...rest };
    } else {
      const rewrites = readRewrites();
      const newRewrite = {
        id,
        userId,
        resumeId,
        originalname,
        targetRole,
        originalContent,
        rewrittenContent,
        improvements,
        atsImpact,
        createdAt: new Date().toISOString()
      };
      rewrites.push(newRewrite);
      writeRewrites(rewrites);
      return newRewrite;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('rewrites').find({ userId }).toArray();
      return list
        .map(r => {
          const { _id: id, ...rest } = r;
          return { id, ...rest };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const rewrites = readRewrites();
      return rewrites
        .filter(r => r.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('rewrites').findOne({ _id: id });
      if (!doc) return null;
      const { _id: rwid, ...rest } = doc;
      return { id: rwid, ...rest };
    } else {
      const rewrites = readRewrites();
      return rewrites.find(r => r.id === id) || null;
    }
  }
};
