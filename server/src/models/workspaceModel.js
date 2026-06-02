import fs from 'fs';
import path from 'path';
import { getDb } from '../config/db.js';

const workspacesFile = path.join(process.cwd(), 'data', 'workspaces.json');

const initDb = () => {
  const dir = path.dirname(workspacesFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(workspacesFile)) {
    fs.writeFileSync(workspacesFile, JSON.stringify([]));
  }
};

const readWorkspaces = () => {
  initDb();
  try {
    const data = fs.readFileSync(workspacesFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading workspaces database file:', error);
    return [];
  }
};

const writeWorkspaces = (workspaces) => {
  initDb();
  try {
    fs.writeFileSync(workspacesFile, JSON.stringify(workspaces, null, 2));
  } catch (error) {
    console.error('Error writing to workspaces database file:', error);
  }
};

export const Workspace = {
  create: async ({ name, ownerId, ownerEmail }) => {
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const db = getDb();
    const newWorkspace = {
      name,
      ownerId,
      members: [{ userId: ownerId, email: ownerEmail.toLowerCase(), role: 'admin' }],
      createdAt: new Date().toISOString()
    };

    if (db) {
      const doc = { _id: id, ...newWorkspace };
      await db.collection('workspaces').insertOne(doc);
      return { id, ...newWorkspace };
    } else {
      const workspaces = readWorkspaces();
      const doc = { id, ...newWorkspace };
      workspaces.push(doc);
      writeWorkspaces(workspaces);
      return doc;
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const doc = await db.collection('workspaces').findOne({ _id: id });
      if (!doc) return null;
      const { _id: wid, ...rest } = doc;
      return { id: wid, ...rest };
    } else {
      const workspaces = readWorkspaces();
      return workspaces.find(w => w.id === id) || null;
    }
  },

  findByUserId: async (userId) => {
    const db = getDb();
    if (db) {
      const list = await db.collection('workspaces')
        .find({
          $or: [
            { ownerId: userId },
            { 'members.userId': userId }
          ]
        })
        .toArray();
      return list.map(item => {
        const { _id: id, ...rest } = item;
        return { id, ...rest };
      });
    } else {
      const workspaces = readWorkspaces();
      return workspaces.filter(w => 
        w.ownerId === userId || w.members.some(m => m.userId === userId)
      );
    }
  },

  addMember: async (workspaceId, { userId, email, role }) => {
    const db = getDb();
    if (db) {
      await db.collection('workspaces').updateOne(
        { _id: workspaceId },
        { $push: { members: { userId, email: email.toLowerCase(), role } } }
      );
      const doc = await db.collection('workspaces').findOne({ _id: workspaceId });
      const { _id: wid, ...rest } = doc;
      return { id: wid, ...rest };
    } else {
      const workspaces = readWorkspaces();
      const idx = workspaces.findIndex(w => w.id === workspaceId);
      if (idx === -1) return null;
      
      // Prevent duplicates
      if (!workspaces[idx].members.some(m => m.email === email.toLowerCase())) {
        workspaces[idx].members.push({ userId, email: email.toLowerCase(), role });
        writeWorkspaces(workspaces);
      }
      return workspaces[idx];
    }
  },

  removeMember: async (workspaceId, userId) => {
    const db = getDb();
    if (db) {
      await db.collection('workspaces').updateOne(
        { _id: workspaceId },
        { $pull: { members: { userId } } }
      );
      const doc = await db.collection('workspaces').findOne({ _id: workspaceId });
      if (!doc) return null;
      const { _id: wid, ...rest } = doc;
      return { id: wid, ...rest };
    } else {
      const workspaces = readWorkspaces();
      const idx = workspaces.findIndex(w => w.id === workspaceId);
      if (idx === -1) return null;
      
      workspaces[idx].members = workspaces[idx].members.filter(m => m.userId !== userId);
      writeWorkspaces(workspaces);
      return workspaces[idx];
    }
  },

  updateById: async (id, updates) => {
    const db = getDb();
    if (db) {
      const { id: _, _id: __, ...fields } = updates;
      await db.collection('workspaces').updateOne({ _id: id }, { $set: fields });
      const doc = await db.collection('workspaces').findOne({ _id: id });
      if (!doc) return null;
      const { _id: wid, ...rest } = doc;
      return { id: wid, ...rest };
    } else {
      const workspaces = readWorkspaces();
      const idx = workspaces.findIndex(w => w.id === id);
      if (idx === -1) return null;
      
      const { id: _, ...fields } = updates;
      workspaces[idx] = { ...workspaces[idx], ...fields };
      writeWorkspaces(workspaces);
      return workspaces[idx];
    }
  }
};
