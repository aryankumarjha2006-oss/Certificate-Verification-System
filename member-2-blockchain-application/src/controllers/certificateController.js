import { getDigitalCredentialContract } from '../config/blockchain.js';
import { getDb } from '../config/database.js';
import { computeSHA256 } from '../services/hashService.js';
import qrcode from 'qrcode';

export const issueCertificate = async (req, res) => {
    try {
        const { institutionId, certificateId, studentName, courseName } = req.body;
        
        if (!institutionId || !certificateId || !studentName || !courseName) {
            return res.status(400).json({ error: 'institutionId, certificateId, studentName, and courseName are required' });
        }
        
        let documentHash = req.body.hash || null;
        if (req.file) {
            documentHash = computeSHA256(req.file.buffer);
        }
        
        const contract = getDigitalCredentialContract();
        
        // Verify on-chain existence & validity (transaction was signed by Institution Wallet via MetaMask)
        let onChainCert = null;
        try {
            onChainCert = await contract.getCertificate(certificateId);
        } catch (e) {
            return res.status(404).json({
                error: 'Certificate not found on-chain',
                details: `Certificate ${certificateId} must first be issued on-chain by the authorized institution wallet before metadata synchronization.`
            });
        }
        
        if (!onChainCert || !(onChainCert[7] ?? onChainCert.exists)) {
            return res.status(400).json({ error: `Certificate ${certificateId} does not exist on the blockchain.` });
        }

        const onChainHash = String(onChainCert[1] || onChainCert.certificateHash || '');
        if (documentHash && onChainHash && onChainHash.toLowerCase() !== documentHash.toLowerCase()) {
            return res.status(400).json({
                error: 'Hash mismatch',
                details: `Submitted PDF SHA-256 hash (${documentHash}) does not match on-chain hash (${onChainHash}).`
            });
        }

        // Save metadata to off-chain DB
        const db = getDb();
        const issueDate = req.body.issueDate || new Date().toISOString();

        db.run(
            'INSERT OR REPLACE INTO certificates (id, studentName, courseName, issueDate, institutionId, status) VALUES (?, ?, ?, ?, ?, ?)',
            [certificateId, studentName, courseName, issueDate, institutionId, 'VALID'],
            async (err) => {
                if (err) return res.status(500).json({ error: 'Database error', details: err.message });

                const verifyUrl = `${req.protocol}://${req.get('host')}/verify?id=${certificateId}`;
                let qrCodeDataUrl = null;
                try {
                    qrCodeDataUrl = await qrcode.toDataURL(verifyUrl);
                } catch (e) {}

                res.status(201).json({
                    message: 'Certificate synchronized successfully',
                    certificateId,
                    hash: onChainHash || documentHash,
                    qrCode: qrCodeDataUrl,
                    verifyUrl
                });
            }
        );
    } catch (error) {
        console.error('Synchronization error:', error);
        res.status(500).json({ error: 'Failed to synchronize certificate metadata', details: error.message || error });
    }
};

// Helper for safe audit logging (does not throw or disrupt verification responses)
function logVerificationAttempt(certificateId, status, req) {
    try {
        const db = getDb();
        if (!db) return;
        const timestamp = new Date().toISOString();
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        db.run(
            'INSERT INTO verification_logs (certificateId, timestamp, status, ipAddress, userAgent) VALUES (?, ?, ?, ?, ?)',
            [certificateId || 'UNKNOWN', timestamp, status, String(ipAddress), String(userAgent)],
            (err) => {
                if (err) console.error('Audit log insertion warning (non-fatal):', err.message);
            }
        );
    } catch (logErr) {
        console.error('Audit log exception warning (non-fatal):', logErr.message);
    }
}

export const verifyCertificate = async (req, res) => {
    const { certificateId } = req.body;
    try {
        if (!certificateId) {
            logVerificationAttempt(null, 'INVALID_INPUT', req);
            return res.status(400).json({ error: 'certificateId is required' });
        }
        if (!req.file) {
            logVerificationAttempt(certificateId, 'MISSING_FILE', req);
            return res.status(400).json({ error: 'PDF file is required' });
        }
        
        const documentHash = computeSHA256(req.file.buffer);
        const contract = getDigitalCredentialContract();
        
        const status = await contract.verifyCertificate(certificateId, documentHash);
        
        let version = null;
        if (status !== 'NOT_FOUND') {
            try {
                const certData = await contract.getCertificate(certificateId);
                version = Number(certData.version);
            } catch (e) {
                // If getCertificate reverts or is unavailable
            }
        }
        
        // Log all standard verification outcomes (VALID, TAMPERED, REVOKED, EXPIRED, NOT_FOUND)
        logVerificationAttempt(certificateId, status, req);

        res.json({ certificateId, status, version });
    } catch (error) {
        logVerificationAttempt(certificateId, 'ERROR', req);
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Failed to verify certificate', details: error.message || error });
    }
};

export const revokeCertificate = async (req, res) => {
    try {
        const { institutionId, certificateId } = req.body;
        if (!institutionId || !certificateId) {
            return res.status(400).json({ error: 'institutionId and certificateId are required' });
        }
        const contract = getDigitalCredentialContract();
        
        console.log(`Revoking ${certificateId} on-chain...`);
        const tx = await contract.revokeCertificate(institutionId, certificateId);
        await tx.wait();
        
        res.json({ message: 'Certificate revoked successfully', certificateId });
        // The event listener will update the DB
    } catch (error) {
        console.error('Revoke error:', error);
        res.status(500).json({ error: 'Failed to revoke certificate', details: error.message || error });
    }
};

export const createNewVersion = async (req, res) => {
    try {
        const { institutionId, certificateId } = req.body;
        if (!institutionId || !certificateId) {
            return res.status(400).json({ error: 'institutionId and certificateId are required' });
        }
        if (!req.file) return res.status(400).json({ error: 'PDF file is required' });
        
        const newDocumentHash = computeSHA256(req.file.buffer);
        const newExpiryTimestamp = req.body.newExpiryTimestamp ? parseInt(req.body.newExpiryTimestamp) : 0;
        
        const contract = getDigitalCredentialContract();
        console.log(`Creating new version for ${certificateId} on-chain...`);
        const tx = await contract.createNewVersion(institutionId, certificateId, newDocumentHash, newExpiryTimestamp);
        await tx.wait();
        
        let version = null;
        try {
            const updatedCert = await contract.getCertificate(certificateId);
            version = Number(updatedCert.version);
        } catch (e) {}
        
        res.json({
            message: 'Certificate version created successfully',
            certificateId,
            newHash: newDocumentHash,
            version
        });
    } catch (error) {
        console.error('Create version error:', error);
        res.status(500).json({ error: 'Failed to create new certificate version', details: error.message || error });
    }
};

export const getAllCertificates = (req, res) => {
    const db = getDb();
    db.all('SELECT id, institutionId, issueDate, status FROM certificates ORDER BY rowid DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching certificates', details: err.message });
        res.json(rows || []);
    });
};

export const getCertificateInfo = (req, res) => {
    const { id } = req.params;
    const db = getDb();
    
    db.get('SELECT * FROM certificates WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Certificate not found off-chain' });
        res.json(row);
    });
};

export const getVerificationLogs = (req, res) => {
    const { id } = req.params;
    const db = getDb();
    
    const query = id 
        ? 'SELECT id, certificateId, timestamp, status, ipAddress, userAgent FROM verification_logs WHERE certificateId = ? ORDER BY id DESC'
        : 'SELECT id, certificateId, timestamp, status, ipAddress, userAgent FROM verification_logs ORDER BY id DESC LIMIT 100';
    const params = id ? [id] : [];

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching audit logs', details: err.message });
        res.json({ count: rows ? rows.length : 0, logs: rows || [] });
    });
};
