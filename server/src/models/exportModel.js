import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const exportsFile = path.join(process.cwd(), 'data', 'exports.json');

const initDb = () => {
  const dir = path.dirname(exportsFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(exportsFile)) {
    fs.writeFileSync(exportsFile, JSON.stringify([]));
  }
};

const readExports = () => {
  initDb();
  try {
    const data = fs.readFileSync(exportsFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading exports database file:', error);
    return [];
  }
};

const writeExports = (exportsList) => {
  initDb();
  try {
    fs.writeFileSync(exportsFile, JSON.stringify(exportsList, null, 2));
  } catch (error) {
    console.error('Error writing to exports database file:', error);
  }
};

export const Export = {
  create: async ({ userId, templateName, exportType, fileName }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();

    if (db) {
      const newExport = {
        _id: id,
        userId,
        templateName,
        exportType,
        fileName,
        createdAt: new Date().toISOString()
      };
      await db.collection('exports').insertOne(newExport);
      const { _id: exid, ...rest } = newExport;
      return { id: exid, ...rest };
    } else {
      const exportsList = readExports();
      const newExport = {
        id,
        userId,
        templateName,
        exportType,
        fileName,
        createdAt: new Date().toISOString()
      };
      exportsList.push(newExport);
      writeExports(exportsList);
      return newExport;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('exports').find({ userId }).toArray();
      return list
        .map(e => {
          const { _id: id, ...rest } = e;
          return { id, ...rest };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const exportsList = readExports();
      return exportsList
        .filter(e => e.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }
};
