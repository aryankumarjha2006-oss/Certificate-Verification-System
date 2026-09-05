import express from 'express';
import multer from 'multer';
import {
    issueCertificate,
    verifyCertificate,
    revokeCertificate,
    createNewVersion,
    getCertificateInfo
} from '../controllers/certificateController.js';

const router = express.Router();
// Use memory storage since we just need the buffer to hash it
const upload = multer({ storage: multer.memoryStorage() });

router.post('/issue', upload.single('pdf'), issueCertificate);
router.post('/verify', upload.single('pdf'), verifyCertificate);
router.post('/revoke', revokeCertificate);
router.post('/version', upload.single('pdf'), createNewVersion);
router.get('/:id', getCertificateInfo);

export default router;
