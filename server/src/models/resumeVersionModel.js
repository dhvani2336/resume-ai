import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const versionsFile = path.join(process.cwd(), 'data', 'resume_versions.json');

const initDb = () => {
  const dir = path.dirname(versionsFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(versionsFile)) {
    fs.writeFileSync(versionsFile, JSON.stringify([]));
  }
};

const readVersions = () => {
  initDb();
  try {
    const data = fs.readFileSync(versionsFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading resume versions database file:', error);
    return [];
  }
};

const writeVersions = (versions) => {
  initDb();
  try {
    fs.writeFileSync(versionsFile, JSON.stringify(versions, null, 2));
  } catch (error) {
    console.error('Error writing to resume versions database file:', error);
  }
};

export const ResumeVersion = {
  create: async ({ resumeId, versionNumber, filename, originalname, atsScore, changesSummary }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();
    const newVersion = {
      resumeId,
      versionNumber,
      filename,
      originalname,
      atsScore,
      changesSummary: changesSummary || 'Initial upload version.',
      createdAt: new Date().toISOString()
    };

    if (db) {
      const doc = { _id: id, ...newVersion };
      await db.collection('resume_versions').insertOne(doc);
      return { id, ...newVersion };
    } else {
      const versions = readVersions();
      const doc = { id, ...newVersion };
      versions.push(doc);
      writeVersions(versions);
      return doc;
    }
  },

  findByResumeId: async (resumeId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('resume_versions').find({ resumeId }).toArray();
      return list.map(item => {
        const { _id: id, ...rest } = item;
        return { id, ...rest };
      }).sort((a, b) => b.versionNumber - a.versionNumber); // Newest version first
    } else {
      const versions = readVersions();
      return versions
        .filter(v => v.resumeId === resumeId)
        .sort((a, b) => b.versionNumber - a.versionNumber);
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('resume_versions').findOne({ _id: id });
      if (!doc) return null;
      const { _id: vid, ...rest } = doc;
      return { id: vid, ...rest };
    } else {
      const versions = readVersions();
      return versions.find(v => v.id === id) || null;
    }
  }
};
