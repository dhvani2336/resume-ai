import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const interviewsFile = path.join(process.cwd(), 'data', 'interviews.json');

const initDb = () => {
  const dir = path.dirname(interviewsFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(interviewsFile)) {
    fs.writeFileSync(interviewsFile, JSON.stringify([]));
  }
};

const readInterviews = () => {
  initDb();
  try {
    const data = fs.readFileSync(interviewsFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading interviews database file:', error);
    return [];
  }
};

const writeInterviews = (interviews) => {
  initDb();
  try {
    fs.writeFileSync(interviewsFile, JSON.stringify(interviews, null, 2));
  } catch (error) {
    console.error('Error writing to interviews database file:', error);
  }
};

export const Interview = {
  create: async ({ 
    userId, 
    targetRole, 
    experienceLevel, 
    questions, 
    answers, 
    evaluations, 
    overallScore, 
    strengths, 
    weaknesses, 
    recommendedTopics 
  }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();

    if (db) {
      const newInterview = {
        _id: id,
        userId,
        targetRole,
        experienceLevel,
        questions,
        answers,
        evaluations,
        overallScore,
        strengths,
        weaknesses,
        recommendedTopics,
        createdAt: new Date().toISOString()
      };
      await db.collection('interviews').insertOne(newInterview);
      const { _id: intid, ...rest } = newInterview;
      return { id: intid, ...rest };
    } else {
      const interviews = readInterviews();
      const newInterview = {
        id,
        userId,
        targetRole,
        experienceLevel,
        questions,
        answers,
        evaluations,
        overallScore,
        strengths,
        weaknesses,
        recommendedTopics,
        createdAt: new Date().toISOString()
      };
      interviews.push(newInterview);
      writeInterviews(interviews);
      return newInterview;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('interviews').find({ userId }).toArray();
      return list
        .map(i => {
          const { _id: id, ...rest } = i;
          return { id, ...rest };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const interviews = readInterviews();
      return interviews
        .filter(i => i.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('interviews').findOne({ _id: id });
      if (!doc) return null;
      const { _id: intid, ...rest } = doc;
      return { id: intid, ...rest };
    } else {
      const interviews = readInterviews();
      return interviews.find(i => i.id === id) || null;
    }
  }
};
