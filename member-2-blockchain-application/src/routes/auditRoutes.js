import express from 'express';
import { getAuditEvents } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected audit trail route (requires JWT authentication)
router.get('/events', authenticateToken, getAuditEvents);

export default router;
