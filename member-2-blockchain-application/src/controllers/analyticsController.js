import { getDb } from '../config/database.js';
import { getDigitalCredentialContract } from '../config/blockchain.js';

export const getSummary = async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not initialized' });

        // Query total issued credentials
        const issuedRes = await new Promise((resolve) => {
            db.get(
                `SELECT COUNT(DISTINCT certificateId) as count FROM blockchain_events WHERE eventType = 'CertificateIssued'`,
                [],
                (err, row) => resolve(err || !row ? null : row.count)
            );
        });

        const certsDbCount = await new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as count FROM certificates`, [], (err, row) => resolve(err || !row ? 0 : row.count));
        });

        const totalIssued = Math.max(issuedRes ?? 0, certsDbCount);

        // Query total revoked credentials
        const revokedRes = await new Promise((resolve) => {
            db.get(
                `SELECT COUNT(DISTINCT certificateId) as count FROM blockchain_events WHERE eventType = 'CertificateRevoked'`,
                [],
                (err, row) => resolve(err || !row ? 0 : row.count)
            );
        });

        const revokedDbCount = await new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as count FROM certificates WHERE status = 'REVOKED'`, [], (err, row) => resolve(err || !row ? 0 : row.count));
        });

        const totalRevoked = Math.max(revokedRes, revokedDbCount);
        const activeCertificates = Math.max(0, totalIssued - totalRevoked);

        // Query expired certificates from DB / contract if available
        let totalExpired = 0;
        try {
            const contract = getDigitalCredentialContract();
            const certRows = await new Promise((resolve) => {
                db.all(`SELECT id FROM certificates`, [], (err, rows) => resolve(rows || []));
            });
            const nowSec = Math.floor(Date.now() / 1000);
            for (const c of certRows) {
                try {
                    const cert = await contract.getCertificate(c.id);
                    const expiry = Number(cert.expiryTimestamp || cert[4] || 0);
                    const status = Number(cert.status || cert[5] || 0);
                    if (expiry > 0 && nowSec > expiry && status !== 1) {
                        totalExpired++;
                    }
                } catch (e) {}
            }
        } catch (e) {}

        // Query institutions count
        const instEventsCount = await new Promise((resolve) => {
            db.get(
                `SELECT COUNT(DISTINCT institutionId) as count FROM blockchain_events WHERE eventType = 'InstitutionRegistered'`,
                [],
                (err, row) => resolve(err || !row ? 0 : row.count)
            );
        });

        const instCertCount = await new Promise((resolve) => {
            db.get(
                `SELECT COUNT(DISTINCT institutionId) as count FROM certificates WHERE institutionId IS NOT NULL AND institutionId != ''`,
                [],
                (err, row) => resolve(err || !row ? 0 : row.count)
            );
        });

        const totalInstitutions = Math.max(instEventsCount, instCertCount, instEventsCount > 0 ? instEventsCount : (totalIssued > 0 ? 1 : 0));

        // Query authorized issuers count
        const issuersCount = await new Promise((resolve) => {
            db.get(
                `SELECT COUNT(DISTINCT issuer) as count FROM blockchain_events WHERE issuer IS NOT NULL AND issuer != ''`,
                [],
                (err, row) => resolve(err || !row ? 0 : row.count)
            );
        });
        const totalIssuers = Math.max(issuersCount, totalIssued > 0 ? 1 : 0);

        // Query verification logs stats
        const totalVerifications = await new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as count FROM verification_logs`, [], (err, row) => resolve(err || !row ? 0 : row.count));
        });

        const tamperedAttempts = await new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as count FROM verification_logs WHERE status = 'TAMPERED'`, [], (err, row) => resolve(err || !row ? 0 : row.count));
        });

        res.json({
            totalIssued,
            activeCertificates,
            totalRevoked,
            totalExpired,
            totalInstitutions,
            totalIssuers,
            totalVerifications,
            tamperedAttempts
        });
    } catch (err) {
        console.error('Error fetching analytics summary:', err);
        res.status(500).json({ error: 'Failed to fetch analytics summary', details: err.message });
    }
};

export const getIssuanceTrends = async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not initialized' });

        // Query daily issuance counts from blockchain_events
        const rows = await new Promise((resolve, reject) => {
            db.all(
                `SELECT substr(timestamp, 1, 10) as date, COUNT(DISTINCT certificateId) as count 
                 FROM blockchain_events 
                 WHERE eventType = 'CertificateIssued' AND certificateId IS NOT NULL
                 GROUP BY substr(timestamp, 1, 10)
                 ORDER BY date ASC`,
                [],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });

        // Fallback to certificates issueDate if blockchain_events has fewer entries
        const certRows = await new Promise((resolve) => {
            db.all(
                `SELECT substr(issueDate, 1, 10) as date, COUNT(*) as count
                 FROM certificates
                 WHERE issueDate IS NOT NULL
                 GROUP BY substr(issueDate, 1, 10)
                 ORDER BY date ASC`,
                [],
                (err, r) => resolve(r || [])
            );
        });

        // Combine maps
        const dateMap = new Map();
        for (const r of rows) {
            if (r.date) dateMap.set(r.date, Number(r.count));
        }
        for (const r of certRows) {
            if (r.date) {
                const current = dateMap.get(r.date) || 0;
                dateMap.set(r.date, Math.max(current, Number(r.count)));
            }
        }

        const formatted = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));
        res.json(formatted);
    } catch (err) {
        console.error('Error fetching issuance trends:', err);
        res.status(500).json({ error: 'Failed to fetch issuance trends', details: err.message });
    }
};

export const getVerificationTrends = async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not initialized' });

        const rows = await new Promise((resolve, reject) => {
            db.all(
                `SELECT substr(timestamp, 1, 10) as date, COUNT(*) as count 
                 FROM verification_logs 
                 WHERE timestamp IS NOT NULL
                 GROUP BY substr(timestamp, 1, 10)
                 ORDER BY date ASC`,
                [],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });

        res.json(rows);
    } catch (err) {
        console.error('Error fetching verification trends:', err);
        res.status(500).json({ error: 'Failed to fetch verification trends', details: err.message });
    }
};

export const getVerificationResults = async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not initialized' });

        const rows = await new Promise((resolve, reject) => {
            db.all(
                `SELECT status, COUNT(*) as count 
                 FROM verification_logs 
                 GROUP BY status`,
                [],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });

        const statusMap = {
            VALID: 0,
            TAMPERED: 0,
            REVOKED: 0,
            EXPIRED: 0,
            NOT_FOUND: 0
        };

        for (const row of rows) {
            if (row.status && statusMap.hasOwnProperty(row.status)) {
                statusMap[row.status] = Number(row.count);
            }
        }

        res.json(statusMap);
    } catch (err) {
        console.error('Error fetching verification results breakdown:', err);
        res.status(500).json({ error: 'Failed to fetch verification results', details: err.message });
    }
};

export const getInstitutionBreakdown = async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not initialized' });

        const rows = await new Promise((resolve) => {
            db.all(
                `SELECT institutionId, COUNT(DISTINCT certificateId) as count 
                 FROM blockchain_events 
                 WHERE eventType = 'CertificateIssued' AND institutionId IS NOT NULL AND institutionId != ''
                 GROUP BY institutionId`,
                [],
                (err, r) => resolve(r || [])
            );
        });

        const certRows = await new Promise((resolve) => {
            db.all(
                `SELECT institutionId, COUNT(*) as count 
                 FROM certificates 
                 WHERE institutionId IS NOT NULL AND institutionId != ''
                 GROUP BY institutionId`,
                [],
                (err, r) => resolve(r || [])
            );
        });

        const map = new Map();
        for (const r of rows) {
            if (r.institutionId) map.set(r.institutionId, Number(r.count));
        }
        for (const r of certRows) {
            if (r.institutionId) {
                const current = map.get(r.institutionId) || 0;
                map.set(r.institutionId, Math.max(current, Number(r.count)));
            }
        }

        const breakdown = Array.from(map.entries()).map(([institutionId, count]) => ({
            institutionId,
            count
        }));

        res.json(breakdown);
    } catch (err) {
        console.error('Error fetching institution breakdown:', err);
        res.status(500).json({ error: 'Failed to fetch institution breakdown', details: err.message });
    }
};

export const getRecentActivity = async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not initialized' });

        let recentIssuances = await new Promise((resolve) => {
            db.all(
                `SELECT certificateId as id, institutionId, timestamp, blockNumber, version 
                 FROM blockchain_events 
                 WHERE eventType = 'CertificateIssued' AND certificateId IS NOT NULL
                 ORDER BY rowid DESC LIMIT 5`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        if (!recentIssuances || recentIssuances.length === 0) {
            recentIssuances = await new Promise((resolve) => {
                db.all(
                    `SELECT id, institutionId, issueDate as timestamp, 1 as version 
                     FROM certificates 
                     ORDER BY rowid DESC LIMIT 5`,
                    [],
                    (err, rows) => resolve(rows || [])
                );
            });
        }

        let recentRevocations = await new Promise((resolve) => {
            db.all(
                `SELECT certificateId as id, timestamp, blockNumber 
                 FROM blockchain_events 
                 WHERE eventType = 'CertificateRevoked' AND certificateId IS NOT NULL
                 ORDER BY rowid DESC LIMIT 5`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        if (!recentRevocations || recentRevocations.length === 0) {
            recentRevocations = await new Promise((resolve) => {
                db.all(
                    `SELECT id, issueDate as timestamp 
                     FROM certificates 
                     WHERE status = 'REVOKED'
                     ORDER BY rowid DESC LIMIT 5`,
                    [],
                    (err, rows) => resolve(rows || [])
                );
            });
        }

        const recentVerifications = await new Promise((resolve) => {
            db.all(
                `SELECT id, certificateId, timestamp, status 
                 FROM verification_logs 
                 ORDER BY id DESC LIMIT 5`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        res.json({
            recentIssuances,
            recentRevocations,
            recentVerifications
        });
    } catch (err) {
        console.error('Error fetching recent activity:', err);
        res.status(500).json({ error: 'Failed to fetch recent activity', details: err.message });
    }
};
