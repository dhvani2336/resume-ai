import { MongoClient } from 'mongodb';

let client = null;
let db = null;

export const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[Database] MONGODB_URI is not configured in .env. Using local JSON files.');
    return null;
  }
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    console.log('[Database] Connected successfully to MongoDB Atlas.');
    
    // Create database indexes
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error('[Database] Connection to MongoDB Atlas failed:', error);
    console.log('[Database] Falling back to local JSON file storage.');
    return null;
  }
};

const createIndexes = async (database) => {
  try {
    console.log('[Database] Checking/creating collection indexes...');
    await database.collection('users').createIndex({ email: 1 }, { unique: true });
    await database.collection('analyses').createIndex({ userId: 1 });
    await database.collection('analyses').createIndex({ workspaceId: 1 });
    await database.collection('analyses').createIndex({ shareToken: 1 });
    await database.collection('job_matches').createIndex({ userId: 1 });
    await database.collection('job_matches').createIndex({ shareToken: 1 });
    await database.collection('workspaces').createIndex({ ownerId: 1 });
    await database.collection('workspaces').createIndex({ 'members.userId': 1 });
    await database.collection('notifications').createIndex({ userId: 1 });
    await database.collection('audit_logs').createIndex({ userId: 1 });
    await database.collection('audit_logs').createIndex({ timestamp: -1 });
    console.log('[Database] Collection indexes initialized successfully.');
  } catch (error) {
    console.error('[Database] Index creation error:', error);
  }
};

export const getDb = () => db;
