import express from 'express';
import multer from 'multer';
import {
    issueCertificate,
    verifyCertificate,
    revokeCertificate,
    createNewVersion,
    getAllCertificates,
    getCertificateInfo,
    getVerificationLogs
} from '../controllers/certificateController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
// Use memory storage since we just need the buffer to hash it
const upload = multer({ storage: multer.memoryStorage() });

// Protected routes (require JWT authentication)
router.post('/issue', authenticateToken, upload.single('pdf'), issueCertificate);
router.post('/revoke', authenticateToken, revokeCertificate);
router.post('/version', authenticateToken, upload.single('pdf'), createNewVersion);
router.get('/audit/all', authenticateToken, getVerificationLogs);
router.get('/:id/audit', authenticateToken, getVerificationLogs);

// Public routes (read-only verification)
router.post('/verify', upload.single('pdf'), verifyCertificate);
router.get('/', getAllCertificates);
router.get('/:id', getCertificateInfo);

export default router;
