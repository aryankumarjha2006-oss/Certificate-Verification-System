import express from 'express';
import {
    getSummary,
    getIssuanceTrends,
    getVerificationTrends,
    getVerificationResults,
    getInstitutionBreakdown,
    getRecentActivity
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected analytics endpoints (require JWT token)
router.get('/summary', authenticateToken, getSummary);
router.get('/issuance-trends', authenticateToken, getIssuanceTrends);
router.get('/verification-trends', authenticateToken, getVerificationTrends);
router.get('/verification-results', authenticateToken, getVerificationResults);
router.get('/institutions', authenticateToken, getInstitutionBreakdown);
router.get('/recent-activity', authenticateToken, getRecentActivity);

export default router;
