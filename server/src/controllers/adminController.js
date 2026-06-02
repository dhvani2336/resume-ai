import fs from 'fs';
import path from 'path';
import { User } from '../models/userModel.js';
import { AuditLog } from '../models/auditLogModel.js';
import { ErrorLog } from '../models/errorLogModel.js';
import { getDb } from '../config/db.js';
import { cache } from '../utils/cache.js';

// Fallback JSON helper
const readJsonFile = (filename) => {
  const filePath = path.join(process.cwd(), 'data', filename);
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    return [];
  }
};

const writeJsonFile = (filename, data) => {
  const filePath = path.join(process.cwd(), 'data', filename);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Failed to write JSON log to ${filename}:`, e);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be user or admin.'
      });
    }

    const updatedUser = await User.updateById(targetUserId, { role });
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: `Changed role of user ${updatedUser.email} to ${role}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserSubscription = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const { subscription } = req.body;

    if (!subscription || !['free', 'premium'].includes(subscription)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription tier. Must be free or premium.'
      });
    }

    const updatedUser = await User.updateById(targetUserId, { subscription });
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: `Changed subscription of user ${updatedUser.email} to ${subscription}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'User subscription tier updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    
    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own admin account.'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    const db = getDb();
    if (db) {
      await db.collection('users').deleteOne({ _id: targetUserId });
    } else {
      const users = readJsonFile('users.json');
      const filtered = users.filter(u => u.id !== targetUserId);
      writeJsonFile('users.json', filtered);
    }

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: `Deleted user account: ${targetUser.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'User account deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemAnalytics = async (req, res, next) => {
  try {
    // Check Cache first
    const cachedStats = cache.get('system-analytics');
    if (cachedStats) {
      return res.status(200).json({
        success: true,
        stats: cachedStats,
        cached: true
      });
    }

    const db = getDb();
    let stats = {};

    if (db) {
      const totalUsers = await db.collection('users').countDocuments();
      const premiumUsers = await db.collection('users').countDocuments({ subscription: 'premium' });
      const freeUsers = totalUsers - premiumUsers;

      const totalResumes = await db.collection('analyses').countDocuments();
      const totalJobMatches = await db.collection('jobmatches').countDocuments();
      const totalRewrites = await db.collection('rewrites').countDocuments();
      const totalExports = await db.collection('exports').countDocuments();
      
      const totalCoverLetters = await db.collection('cover_letters').countDocuments();
      const totalLinkedInProfiles = await db.collection('linkedin_profiles').countDocuments();
      const totalPortfolios = await db.collection('portfolios').countDocuments();

      // Average ATS Score
      const avgAtsRes = await db.collection('analyses').aggregate([
        { $group: { _id: null, avgScore: { $avg: '$atsScore' } } }
      ]).toArray();
      const averageAtsScore = avgAtsRes.length > 0 ? Math.round(avgAtsRes[0].avgScore) : 0;

      stats = {
        totalUsers,
        premiumUsers,
        freeUsers,
        totalResumes,
        totalJobMatches,
        totalRewrites,
        totalExports,
        totalCoverLetters,
        totalLinkedInProfiles,
        totalPortfolios,
        averageAtsScore
      };
    } else {
      const users = readJsonFile('users.json');
      const analyses = readJsonFile('analyses.json');
      const jobmatches = readJsonFile('jobmatches.json');
      const rewrites = readJsonFile('rewrites.json');
      const exportsList = readJsonFile('exports.json');
      const coverletters = readJsonFile('cover_letters.json');
      const linkedin = readJsonFile('linkedin_profiles.json');
      const portfolios = readJsonFile('portfolios.json');

      const totalUsers = users.length;
      const premiumUsers = users.filter(u => u.subscription === 'premium').length;
      const freeUsers = totalUsers - premiumUsers;

      const totalResumes = analyses.length;
      const totalJobMatches = jobmatches.length;
      const totalRewrites = rewrites.length;
      const totalExports = exportsList.length;
      const totalCoverLetters = coverletters.length;
      const totalLinkedInProfiles = linkedin.length;
      const totalPortfolios = portfolios.length;

      const totalScore = analyses.reduce((sum, item) => sum + (item.atsScore || 0), 0);
      const averageAtsScore = totalResumes > 0 ? Math.round(totalScore / totalResumes) : 0;

      stats = {
        totalUsers,
        premiumUsers,
        freeUsers,
        totalResumes,
        totalJobMatches,
        totalRewrites,
        totalExports,
        totalCoverLetters,
        totalLinkedInProfiles,
        totalPortfolios,
        averageAtsScore
      };
    }

    // Set cache (expires in 5 minutes)
    cache.set('system-analytics', stats, 5 * 60 * 1000);

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.findRecent(200);
    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    next(error);
  }
};

export const getErrorLogs = async (req, res, next) => {
  try {
    const logs = await ErrorLog.findRecent(200);
    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    next(error);
  }
};
