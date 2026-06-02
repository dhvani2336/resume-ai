import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../config/db.js';

const usersFile = path.join(process.cwd(), 'data', 'users.json');

const initDb = () => {
  const dir = path.dirname(usersFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
  }
};

const readUsers = () => {
  initDb();
  try {
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading users database file:', error);
    return [];
  }
};

const writeUsers = (users) => {
  initDb();
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing to users database file:', error);
  }
};

export const User = {
  create: async ({ name, email, password }) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const db = getDb();
    const isFirstUser = db 
      ? (await db.collection('users').countDocuments()) === 0 
      : readUsers().length === 0;

    const role = isFirstUser ? 'admin' : 'user';

    const newUserBase = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      resetPasswordOtp: null,
      resetPasswordOtpExpires: null,
      profilePhoto: '',
      role,
      subscription: 'free',
      createdAt: new Date().toISOString()
    };

    if (db) {
      const newUser = { _id: id, ...newUserBase };
      await db.collection('users').insertOne(newUser);
      const { password: _, _id: uid, ...userWithoutPassword } = newUser;
      return { id: uid, ...userWithoutPassword };
    } else {
      const users = readUsers();
      const newUser = { id, ...newUserBase };
      users.push(newUser);
      writeUsers(users);
      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    }
  },

  findByEmail: async (email) => {
    const db = getDb();
    if (db) {
      const user = await db.collection('users').findOne({ email: email.toLowerCase() });
      if (!user) return null;
      const { _id: id, ...rest } = user;
      return { id, ...rest };
    } else {
      const users = readUsers();
      return users.find(u => u.email === email.toLowerCase()) || null;
    }
  },

  findById: async (id) => {
    const db = getDb();
    if (db) {
      const user = await db.collection('users').findOne({ _id: id });
      if (!user) return null;
      const { password: _, _id: uid, ...userWithoutPassword } = user;
      return { id: uid, ...userWithoutPassword };
    } else {
      const users = readUsers();
      const user = users.find(u => u.id === id);
      if (!user) return null;
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
  },

  findByVerificationToken: async (token) => {
    const db = getDb();
    if (db) {
      const user = await db.collection('users').findOne({ verificationToken: token });
      if (!user) return null;
      const { _id: id, ...rest } = user;
      return { id, ...rest };
    } else {
      const users = readUsers();
      return users.find(u => u.verificationToken === token) || null;
    }
  },

  updateById: async (id, updates) => {
    const db = getDb();
    if (db) {
      const { id: unusedId, _id: unusedDbId, ...fields } = updates;
      await db.collection('users').updateOne({ _id: id }, { $set: fields });
      const user = await db.collection('users').findOne({ _id: id });
      if (!user) return null;
      const { password: unusedPassword, _id: uid, ...userWithoutPassword } = user;
      return { id: uid, ...userWithoutPassword };
    } else {
      const users = readUsers();
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) return null;
      
      const { id: unusedId, ...fields } = updates;
      users[idx] = { ...users[idx], ...fields };
      writeUsers(users);
      
      const { password: unusedPassword, ...userWithoutPassword } = users[idx];
      return userWithoutPassword;
    }
  },

  findAll: async () => {
    const db = getDb();
    if (db) {
      const list = await db.collection('users').find().toArray();
      return list.map(user => {
        const { password: _, _id: uid, ...userWithoutPassword } = user;
        return { id: uid, ...userWithoutPassword };
      });
    } else {
      const users = readUsers();
      return users.map(user => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    }
  },

  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
};
