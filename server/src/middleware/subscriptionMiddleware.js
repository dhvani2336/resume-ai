import { Analysis } from '../models/analysisModel.js';
import { JobMatch } from '../models/jobMatchModel.js';
import { Rewrite } from '../models/rewriteModel.js';

export const checkSubscriptionLimit = (feature) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized.'
        });
      }

      // Admins and Premium users have unlimited access
      if (user.role === 'admin' || user.subscription === 'premium') {
        return next();
      }

      const userId = user.id;

      if (feature === 'resumes') {
        const analyses = await Analysis.findByUserId(userId);
        if (analyses.length >= 3) {
          return res.status(403).json({
            success: false,
            error: 'Subscription Limit Reached: Free tier is limited to 3 resume scans. Please upgrade to Premium for unlimited scans.'
          });
        }
      } else if (feature === 'job-matches') {
        const matches = await JobMatch.findByUserId(userId);
        if (matches.length >= 1) {
          return res.status(403).json({
            success: false,
            error: 'Subscription Limit Reached: Free tier is limited to 1 job match check. Please upgrade to Premium for unlimited checks.'
          });
        }
      } else if (feature === 'rewrites') {
        const rewrites = await Rewrite.findByUserId(userId);
        if (rewrites.length >= 1) {
          return res.status(403).json({
            success: false,
            error: 'Subscription Limit Reached: Free tier is limited to 1 AI rewrite. Please upgrade to Premium for unlimited rewrites.'
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
