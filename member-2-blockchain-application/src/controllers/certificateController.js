import { getDigitalCredentialContract, getDigitalCredentialContractForInstitution, getInstitutionSigner, verifyInstitutionSignerOnChain, getLiveNonce, parseContractError } from '../config/blockchain.js';
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
        if (!documentHash) {
            return res.status(400).json({ error: 'Certificate document hash or PDF file is required' });
        }

        const expiryTimestamp = req.body.expiryTimestamp ? parseInt(req.body.expiryTimestamp) : 0;
        const signer = getInstitutionSigner(institutionId);
        const signerAddress = await signer.getAddress();
        await verifyInstitutionSignerOnChain(institutionId, signerAddress);
        const contract = getDigitalCredentialContractForInstitution(institutionId);

        let txHash = req.body.txHash || null;
        let blockNumber = null;

        // Check on-chain status
        let onChainCert = null;
        try {
            onChainCert = await contract.getCertificate(certificateId);
        } catch (e) {
            // Not found on chain yet
        }

        if (!onChainCert || !(onChainCert[7] ?? onChainCert.exists)) {
            console.log(`[Managed Signing] Issuing ${certificateId} for ${institutionId} on-chain via wallet ${signerAddress}...`);
            const nonce = await getLiveNonce(signer);
            const tx = await contract.issueCertificate(institutionId, certificateId, documentHash, expiryTimestamp, { nonce });
            const receipt = await tx.wait();
            txHash = receipt.hash;
            blockNumber = receipt.blockNumber;
            console.log(`[Managed Signing] Certificate ${certificateId} confirmed on-chain in block ${blockNumber} (tx: ${txHash})`);
        } else {
            const onChainHash = String(onChainCert[1] || onChainCert.certificateHash || '');
            if (documentHash && onChainHash && onChainHash.toLowerCase() !== documentHash.toLowerCase()) {
                return res.status(400).json({
                    error: 'Hash mismatch',
                    details: `Submitted PDF SHA-256 hash (${documentHash}) does not match on-chain hash (${onChainHash}).`
                });
            }
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
                    message: 'Certificate issued & synchronized successfully on-chain',
                    certificateId,
                    hash: documentHash,
                    txHash,
                    blockNumber,
                    issuer: signerAddress,
                    institutionId,
                    qrCode: qrCodeDataUrl,
                    verifyUrl
                });
            }
        );
    } catch (error) {
        const parsedMsg = parseContractError(error);
        console.error('Issuance error:', parsedMsg, error);
        res.status(500).json({ error: 'Failed to issue certificate on-chain', details: parsedMsg });
    }
};

// Helper to auto-detect Certificate ID from uploaded PDF buffer
function extractCertificateIdFromPdf(buffer) {
    if (!buffer) return null;
    const raw = buffer.toString('latin1');

    // 1. Search for URL parameter id=... or certId=... in QR code link or text annotations
    const urlMatch = raw.match(/(?:verify(?:\.html)?\?id=|id=|certId=)([\w\-]+)/i);
    if (urlMatch && urlMatch[1] && urlMatch[1].length >= 3) {
        return urlMatch[1];
    }

    // 2. Search for explicit Certificate ID patterns (e.g. Certificate ID: CERT-123)
    const certIdMatch = raw.match(/(?:Certificate\s*ID\s*:?\s*|Cert\s*ID\s*:?\s*)([\w\-]+)/i);
    if (certIdMatch && certIdMatch[1] && certIdMatch[1].length >= 3) {
        return certIdMatch[1];
    }

    // 3. Search for standard CredChain ID prefixes (CERT_, CERT-, AUDIT_CERT_, ISO_CERT_)
    const prefixMatch = raw.match(/\b(CERT[_\-][A-Za-z0-9_\-]+|AUDIT_CERT_[A-Za-z0-9_\-]+|ISO_CERT_[A-Za-z0-9_\-]+)\b/i);
    if (prefixMatch && prefixMatch[1]) {
        return prefixMatch[1];
    }

    return null;
}

// Helper for safe audit logging (does not throw or disrupt verification responses)
function logVerificationAttempt(certificateId, status, req) {
    try {
        const db = getDb();
        if (!db) return;
        const timestamp = new Date().toISOString();
        const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || 'unknown';
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
    let certificateId = (req.body.certificateId || '').trim();
    try {
        if (!req.file) {
            logVerificationAttempt(certificateId || null, 'MISSING_FILE', req);
            return res.status(400).json({ error: 'PDF file is required' });
        }

        // Auto-detect Certificate ID from PDF if not manually provided
        if (!certificateId) {
            certificateId = extractCertificateIdFromPdf(req.file.buffer);
            if (!certificateId) {
                logVerificationAttempt('UNEXTRACTABLE', 'INVALID_INPUT', req);
                return res.status(400).json({
                    error: 'Credential ID could not be detected automatically from this PDF. Please enter the Credential ID manually.',
                    requiresManualId: true
                });
            }
            console.log(`[Verification] Auto-detected Credential ID from PDF: ${certificateId}`);
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
        logVerificationAttempt(certificateId || 'ERROR', 'ERROR', req);
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
        const signer = getInstitutionSigner(institutionId);
        const signerAddress = await signer.getAddress();
        await verifyInstitutionSignerOnChain(institutionId, signerAddress);
        const contract = getDigitalCredentialContractForInstitution(institutionId);
        
        console.log(`[Managed Signing] Revoking ${certificateId} on-chain for ${institutionId} via wallet ${signerAddress}...`);
        const nonce = await getLiveNonce(signer);
        const tx = await contract.revokeCertificate(institutionId, certificateId, { nonce });
        const receipt = await tx.wait();
        
        res.json({
            message: 'Certificate revoked successfully on-chain',
            certificateId,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            issuer: signerAddress
        });
    } catch (error) {
        const parsedMsg = parseContractError(error);
        console.error('Revoke error:', parsedMsg, error);
        res.status(500).json({ error: 'Failed to revoke certificate on-chain', details: parsedMsg });
    }
};

export const createNewVersion = async (req, res) => {
    try {
        const { institutionId, certificateId } = req.body;
        if (!institutionId || !certificateId) {
            return res.status(400).json({ error: 'institutionId and certificateId are required' });
        }
        if (!req.file && !req.body.hash) return res.status(400).json({ error: 'PDF file or hash is required' });
        
        const newDocumentHash = req.file ? computeSHA256(req.file.buffer) : req.body.hash;
        const newExpiryTimestamp = req.body.newExpiryTimestamp ? parseInt(req.body.newExpiryTimestamp) : 0;
        
        const signer = getInstitutionSigner(institutionId);
        const signerAddress = await signer.getAddress();
        await verifyInstitutionSignerOnChain(institutionId, signerAddress);
        const contract = getDigitalCredentialContractForInstitution(institutionId);

        console.log(`[Managed Signing] Creating new version for ${certificateId} on-chain via wallet ${signerAddress}...`);
        const nonce = await getLiveNonce(signer);
        const tx = await contract.createNewVersion(institutionId, certificateId, newDocumentHash, newExpiryTimestamp, { nonce });
        const receipt = await tx.wait();
        
        let version = null;
        try {
            const updatedCert = await contract.getCertificate(certificateId);
            version = Number(updatedCert.version);
        } catch (e) {}
        
        res.json({
            message: 'Certificate version created successfully on-chain',
            certificateId,
            newHash: newDocumentHash,
            version,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            issuer: signerAddress
        });
    } catch (error) {
        const parsedMsg = parseContractError(error);
        console.error('Create version error:', parsedMsg, error);
        res.status(500).json({ error: 'Failed to create new certificate version on-chain', details: parsedMsg });
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
