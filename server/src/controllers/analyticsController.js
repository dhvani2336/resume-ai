import { Analysis } from '../models/analysisModel.js';
import { JobMatch } from '../models/jobMatchModel.js';
import { Rewrite } from '../models/rewriteModel.js';
import { Export } from '../models/exportModel.js';

// Helper to format month
const getMonthYearKey = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (err) {
    return 'Unknown';
  }
};

// GET /api/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user-specific records
    const analyses = (await Analysis.findByUserId(userId)) || [];
    const jobMatches = (await JobMatch.findByUserId(userId)) || [];
    const rewrites = (await Rewrite.findByUserId(userId)) || [];
    const exportsLog = (await Export.findByUserId(userId)) || [];

    // 1. Calculate Metrics
    const totalResumes = analyses.length;
    
    // Average ATS Score
    const totalAtsScore = analyses.reduce((sum, a) => sum + (Number(a.atsScore) || 0), 0);
    const averageAtsScore = totalResumes > 0 ? parseFloat((totalAtsScore / totalResumes).toFixed(1)) : 0;

    // Highest ATS Score
    const highestAtsScore = totalResumes > 0 ? Math.max(...analyses.map(a => Number(a.atsScore) || 0)) : 0;

    const totalJobMatches = jobMatches.length;
    const totalRewrites = rewrites.length;
    const totalExports = exportsLog.length;

    // 2. Chronological Trends (Oldest to Newest)
    const analysesSorted = [...analyses].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const jobMatchesSorted = [...jobMatches].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // ATS Score Trend
    const atsScoreTrend = analysesSorted.map(a => ({
      date: a.createdAt.split('T')[0],
      score: Number(a.atsScore) || 0,
      originalname: a.originalname
    }));

    // Job Match Score Trend
    const jobMatchScoreTrend = jobMatchesSorted.map(jm => ({
      date: jm.createdAt.split('T')[0],
      score: Number(jm.matchScore) || 0,
      originalname: jm.originalname
    }));

    // 3. Resume Upload Activity (Daily uploads counts)
    const dailyUploads = {};
    analysesSorted.forEach(a => {
      const date = a.createdAt.split('T')[0];
      dailyUploads[date] = (dailyUploads[date] || 0) + 1;
    });
    const uploadActivity = Object.entries(dailyUploads).map(([date, count]) => ({
      date,
      count
    }));

    // 4. Monthly Usage Statistics
    const monthlyMap = {};
    
    const getOrInitMonth = (monthKey) => {
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          uploads: 0,
          jobMatches: 0,
          rewrites: 0,
          exports: 0
        };
      }
      return monthlyMap[monthKey];
    };

    analyses.forEach(a => {
      const month = getMonthYearKey(a.createdAt);
      getOrInitMonth(month).uploads += 1;
    });

    jobMatches.forEach(jm => {
      const month = getMonthYearKey(jm.createdAt);
      getOrInitMonth(month).jobMatches += 1;
    });

    rewrites.forEach(rw => {
      const month = getMonthYearKey(rw.createdAt);
      getOrInitMonth(month).rewrites += 1;
    });

    exportsLog.forEach(ex => {
      const month = getMonthYearKey(ex.createdAt);
      getOrInitMonth(month).exports += 1;
    });

    const monthlyUsage = Object.values(monthlyMap).sort(
      (a, b) => new Date(a.month) - new Date(b.month)
    );

    // 5. Recent Activity Timeline (Unified stream, last 10 entries)
    const recentActivity = [
      ...analyses.map(a => ({
        id: a.id,
        type: 'upload',
        title: `Analyzed "${a.originalname}"`,
        description: `ATS Score achieved: ${a.atsScore}`,
        timestamp: a.createdAt
      })),
      ...jobMatches.map(jm => ({
        id: jm.id,
        type: 'job-match',
        title: `Matched "${jm.originalname}"`,
        description: `Match Score: ${jm.matchScore}%`,
        timestamp: jm.createdAt
      })),
      ...rewrites.map(rw => ({
        id: rw.id,
        type: 'rewrite',
        title: `Rewrote resume content`,
        description: `Target role: ${rw.targetRole}`,
        timestamp: rw.createdAt
      })),
      ...exportsLog.map(ex => ({
        id: ex.id,
        type: 'export',
        title: `Exported Resume (.${ex.exportType.toUpperCase()})`,
        description: `Template: ${ex.templateName.toUpperCase()}`,
        timestamp: ex.createdAt
      }))
    ];

    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const finalTimeline = recentActivity.slice(0, 10);

    return res.status(200).json({
      success: true,
      metrics: {
        totalResumes,
        averageAtsScore,
        highestAtsScore,
        totalJobMatches,
        totalRewrites,
        totalExports
      },
      charts: {
        atsScoreTrend,
        jobMatchScoreTrend,
        uploadActivity,
        monthlyUsage
      },
      recentActivity: finalTimeline
    });

  } catch (error) {
    next(error);
  }
};
