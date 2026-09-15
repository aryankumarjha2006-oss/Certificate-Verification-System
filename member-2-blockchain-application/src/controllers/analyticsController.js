import { getDb } from '../config/database.js';
import { getDigitalCredentialContract, getCertificateRegistryContract, getInstitutionRegistryContract } from '../config/blockchain.js';

export const getSummary = async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not initialized' });

        // Query on-chain CertificateRegistry / DigitalCredential contract if available
        let crContract = null;
        let irContract = null;
        try {
            crContract = getCertificateRegistryContract();
            irContract = getInstitutionRegistryContract();
        } catch (e) {}

        const uniqueCertIds = new Set();

        // 1. Authoritative on-chain certificate discovery
        if (crContract && typeof crContract.getAllCertificateIds === 'function') {
            try {
                const onChainIds = await crContract.getAllCertificateIds();
                for (const cid of onChainIds) {
                    if (cid && typeof cid === 'string') uniqueCertIds.add(cid);
                }
            } catch (e) {}
        }

        // Database fallback & cross-check
        const dbCertRows = await new Promise((resolve) => {
            db.all('SELECT id, status, issueDate, institutionId FROM certificates', [], (err, rows) => resolve(rows || []));
        });
        for (const row of dbCertRows) {
            if (row.id && !row.id.startsWith('0x')) uniqueCertIds.add(row.id);
        }

        const nowSec = Math.floor(Date.now() / 1000);
        let activeCount = 0;
        let revokedCount = 0;
        let expiredCount = 0;

        for (const certId of uniqueCertIds) {
            let onChainCert = null;
            if (crContract) {
                try {
                    const cert = await crContract.getCertificate(certId);
                    if (cert && (cert[7] ?? cert.exists)) {
                        onChainCert = cert;
                    }
                } catch (e) {
                    // Not found on current chain deployment or reverted
                }
            }

            if (onChainCert) {
                const statusNum = Number(onChainCert[5] ?? onChainCert.status ?? 0);
                const expiry = Number(onChainCert[4] ?? onChainCert.expiryTimestamp ?? 0);
                if (statusNum === 1) {
                    revokedCount++;
                } else if (expiry > 0 && nowSec > expiry) {
                    expiredCount++;
                } else {
                    activeCount++;
                }
            } else {
                // Fallback to persistent database record if on-chain query is unavailable
                const row = dbCertRows.find(r => r.id === certId);
                if (row) {
                    const isRevoked = row.status === 'REVOKED';
                    const isExpired = row.expiryDate ? (Math.floor(new Date(row.expiryDate).getTime() / 1000) < nowSec) : false;
                    if (isRevoked) {
                        revokedCount++;
                    } else if (isExpired) {
                        expiredCount++;
                    } else {
                        activeCount++;
                    }
                }
            }
        }

        const totalIssued = uniqueCertIds.size;
        const activeCertificates = activeCount;
        const totalRevoked = revokedCount;
        const totalExpired = expiredCount;

        // 2. Discover registered active institutions directly from on-chain contract
        const activeInstSet = new Set();
        const candidateInstIds = new Set();

        if (irContract && typeof irContract.getAllInstitutionIds === 'function') {
            try {
                const onChainInstIds = await irContract.getAllInstitutionIds();
                for (const id of onChainInstIds) {
                    if (id && typeof id === 'string') candidateInstIds.add(id);
                }
            } catch (e) {}
        }

        const dbInstRows = await new Promise((resolve) => {
            db.all(
                `SELECT DISTINCT institutionId FROM certificates WHERE institutionId IS NOT NULL AND institutionId != ''
                 UNION
                 SELECT DISTINCT institutionId FROM blockchain_events WHERE institutionId IS NOT NULL AND institutionId != ''`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        for (const r of dbInstRows) {
            if (r.institutionId && !r.institutionId.startsWith('0x')) {
                candidateInstIds.add(r.institutionId);
            }
        }

        if (irContract) {
            for (const instId of candidateInstIds) {
                try {
                    const inst = await irContract.getInstitution(instId);
                    if (inst && (inst[4] ?? inst.exists) && (inst[3] ?? inst.isActive)) {
                        activeInstSet.add(instId);
                    }
                } catch (e) {}
            }
        } else {
            for (const id of candidateInstIds) {
                activeInstSet.add(id);
            }
        }

        const totalInstitutions = activeInstSet.size;

        // 3. Discover distinct authorized issuer wallets across active institutions
        const authorizedIssuerWallets = new Set();
        if (irContract) {
            const candidateWallets = new Set();
            try {
                const authEvents = await irContract.queryFilter(irContract.filters.IssuerAuthorized(), 0, 'latest');
                for (const ev of authEvents) {
                    if (ev.args && ev.args[1]) {
                        candidateWallets.add(ev.args[1].toLowerCase());
                    }
                }
            } catch (e) {}

            for (const instId of activeInstSet) {
                try {
                    const inst = await irContract.getInstitution(instId);
                    if (inst && inst.wallet && inst.wallet !== '0x0000000000000000000000000000000000000000') {
                        candidateWallets.add(inst.wallet.toLowerCase());
                        authorizedIssuerWallets.add(`${instId}-${inst.wallet.toLowerCase()}`);
                    }
                } catch (e) {}

                for (const wallet of candidateWallets) {
                    try {
                        const isAuth = await irContract.isAuthorizedIssuer(instId, wallet);
                        if (isAuth) {
                            authorizedIssuerWallets.add(`${instId}-${wallet}`);
                        }
                    } catch (e) {}
                }
            }
        } else {
            const dbIssuers = await new Promise((resolve) => {
                db.all(`SELECT DISTINCT issuer FROM blockchain_events WHERE issuer IS NOT NULL AND issuer != ''`, [], (err, rows) => resolve(rows || []));
            });
            for (const r of dbIssuers) {
                if (r.issuer) authorizedIssuerWallets.add(r.issuer.toLowerCase());
            }
        }

        const totalIssuers = authorizedIssuerWallets.size;

        // 4. Verification metrics from persistent verification_logs table
        const totalVerifications = await new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as count FROM verification_logs`, [], (err, row) => resolve(err || !row ? 0 : Number(row.count)));
        });

        const tamperedAttempts = await new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as count FROM verification_logs WHERE status = 'TAMPERED'`, [], (err, row) => resolve(err || !row ? 0 : Number(row.count)));
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

        // Query daily issuance from blockchain_events (only CertificateIssued)
        const eventRows = await new Promise((resolve) => {
            db.all(
                `SELECT substr(timestamp, 1, 10) as date, COUNT(DISTINCT certificateId) as count 
                 FROM blockchain_events 
                 WHERE eventType = 'CertificateIssued' AND certificateId IS NOT NULL AND certificateId != ''
                 GROUP BY substr(timestamp, 1, 10)
                 ORDER BY date ASC`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        const certRows = await new Promise((resolve) => {
            db.all(
                `SELECT substr(issueDate, 1, 10) as date, COUNT(*) as count
                 FROM certificates
                 WHERE issueDate IS NOT NULL AND issueDate != ''
                 GROUP BY substr(issueDate, 1, 10)
                 ORDER BY date ASC`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        const dateMap = new Map();
        for (const r of eventRows) {
            if (r.date) dateMap.set(r.date, Number(r.count));
        }
        for (const r of certRows) {
            if (r.date) {
                const cur = dateMap.get(r.date) || 0;
                dateMap.set(r.date, Math.max(cur, Number(r.count)));
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

        const rows = await new Promise((resolve) => {
            db.all(
                `SELECT substr(timestamp, 1, 10) as date, COUNT(*) as count 
                 FROM verification_logs 
                 WHERE timestamp IS NOT NULL AND timestamp != ''
                 GROUP BY substr(timestamp, 1, 10)
                 ORDER BY date ASC`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        res.json(rows.map(r => ({ date: r.date, count: Number(r.count) })));
    } catch (err) {
        console.error('Error fetching verification trends:', err);
        res.status(500).json({ error: 'Failed to fetch verification trends', details: err.message });
    }
};

export const getVerificationResults = async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not initialized' });

        const rows = await new Promise((resolve) => {
            db.all(
                `SELECT status, COUNT(*) as count 
                 FROM verification_logs 
                 GROUP BY status`,
                [],
                (err, rows) => resolve(rows || [])
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

        let irContract = null;
        try {
            irContract = getInstitutionRegistryContract();
        } catch (e) {}

        const map = new Map();
        const candidateInsts = new Set();

        if (irContract && typeof irContract.getAllInstitutionIds === 'function') {
            try {
                const onChainInstIds = await irContract.getAllInstitutionIds();
                for (const id of onChainInstIds) {
                    if (id && typeof id === 'string') candidateInsts.add(id);
                }
            } catch (e) {}
        }

        const eventRows = await new Promise((resolve) => {
            db.all(
                `SELECT institutionId, COUNT(DISTINCT certificateId) as count 
                 FROM blockchain_events 
                 WHERE eventType = 'CertificateIssued' AND institutionId IS NOT NULL AND institutionId != ''
                 GROUP BY institutionId`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        const certRows = await new Promise((resolve) => {
            db.all(
                `SELECT institutionId, COUNT(*) as count 
                 FROM certificates 
                 WHERE institutionId IS NOT NULL AND institutionId != ''
                 GROUP BY institutionId`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        for (const r of eventRows) {
            if (r.institutionId && !r.institutionId.startsWith('0x')) {
                candidateInsts.add(r.institutionId);
                map.set(r.institutionId, Number(r.count));
            }
        }
        for (const r of certRows) {
            if (r.institutionId && !r.institutionId.startsWith('0x')) {
                candidateInsts.add(r.institutionId);
                const cur = map.get(r.institutionId) || 0;
                map.set(r.institutionId, Math.max(cur, Number(r.count)));
            }
        }

        // Ensure all verified on-chain active institutions exist in the breakdown
        if (irContract) {
            for (const instId of candidateInsts) {
                try {
                    const inst = await irContract.getInstitution(instId);
                    if (inst && (inst[4] ?? inst.exists) && (inst[3] ?? inst.isActive)) {
                        if (!map.has(instId)) {
                            map.set(instId, 0);
                        }
                    } else {
                        map.delete(instId);
                    }
                } catch (e) {
                    map.delete(instId);
                }
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
                 WHERE eventType = 'CertificateIssued' AND certificateId IS NOT NULL AND certificateId != ''
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
                 WHERE eventType = 'CertificateRevoked' AND certificateId IS NOT NULL AND certificateId != ''
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
            recentIssuances: recentIssuances || [],
            recentRevocations: recentRevocations || [],
            recentVerifications: recentVerifications || []
        });
    } catch (err) {
        console.error('Error fetching recent activity:', err);
        res.status(500).json({ error: 'Failed to fetch recent activity', details: err.message });
    }
};
