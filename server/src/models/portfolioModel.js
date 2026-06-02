import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const portfolioFile = path.join(process.cwd(), 'data', 'portfolios.json');

const initDb = () => {
  const dir = path.dirname(portfolioFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(portfolioFile)) {
    fs.writeFileSync(portfolioFile, JSON.stringify([]));
  }
};

const readPortfolios = () => {
  initDb();
  try {
    const data = fs.readFileSync(portfolioFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading portfolios database file:', error);
    return [];
  }
};

const writePortfolios = (portfolios) => {
  initDb();
  try {
    fs.writeFileSync(portfolioFile, JSON.stringify(portfolios, null, 2));
  } catch (error) {
    console.error('Error writing to portfolios database file:', error);
  }
};

export const Portfolio = {
  create: async ({ userId, resumeId, htmlContent }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();
    const newPortfolio = {
      userId,
      resumeId,
      htmlContent,
      createdAt: new Date().toISOString()
    };

    if (db) {
      const doc = { _id: id, ...newPortfolio };
      await db.collection('portfolios').insertOne(doc);
      return { id, ...newPortfolio };
    } else {
      const portfolios = readPortfolios();
      const doc = { id, ...newPortfolio };
      portfolios.push(doc);
      writePortfolios(portfolios);
      return doc;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('portfolios').find({ userId }).toArray();
      return list.map(item => {
        const { _id: id, ...rest } = item;
        return { id, ...rest };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const portfolios = readPortfolios();
      return portfolios
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('portfolios').findOne({ _id: id });
      if (!doc) return null;
      const { _id: pid, ...rest } = doc;
      return { id: pid, ...rest };
    } else {
      const portfolios = readPortfolios();
      return portfolios.find(p => p.id === id) || null;
    }
  }
};
