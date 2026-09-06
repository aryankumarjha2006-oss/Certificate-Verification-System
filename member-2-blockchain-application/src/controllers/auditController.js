import { getDb } from '../config/database.js';

export const getAuditEvents = async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not initialized' });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 25));
        const offset = (page - 1) * limit;

        const { eventType, search, certificateId, institutionId, issuer } = req.query;

        const whereClauses = [];
        const params = [];

        if (eventType && eventType.trim() !== '' && eventType !== 'ALL') {
            whereClauses.push('eventType = ?');
            params.push(eventType.trim());
        }

        if (certificateId && certificateId.trim() !== '') {
            whereClauses.push('certificateId = ?');
            params.push(certificateId.trim());
        }

        if (institutionId && institutionId.trim() !== '') {
            whereClauses.push('institutionId = ?');
            params.push(institutionId.trim());
        }

        if (issuer && issuer.trim() !== '') {
            whereClauses.push('issuer = ?');
            params.push(issuer.trim());
        }

        if (search && search.trim() !== '') {
            const searchTerm = `%${search.trim().toLowerCase()}%`;
            whereClauses.push(
                '(LOWER(certificateId) LIKE ? OR LOWER(institutionId) LIKE ? OR LOWER(issuer) LIKE ? OR LOWER(transactionHash) LIKE ?)'
            );
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query total events count
        const totalCount = await new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM blockchain_events ${whereSql}`, params, (err, row) => {
                if (err) return reject(err);
                resolve(row ? row.count : 0);
            });
        });

        // Query max block number
        const latestBlock = await new Promise((resolve) => {
            db.get(`SELECT MAX(blockNumber) as maxBlock FROM blockchain_events`, [], (err, row) => {
                resolve(err || !row || !row.maxBlock ? 0 : Number(row.maxBlock));
            });
        });

        // Query paginated events
        const queryParams = [...params, limit, offset];
        const events = await new Promise((resolve, reject) => {
            db.all(
                `SELECT id, eventType, certificateId, institutionId, issuer, timestamp, blockNumber, transactionHash, logIndex, version 
                 FROM blockchain_events 
                 ${whereSql} 
                 ORDER BY blockNumber DESC, logIndex DESC, id DESC 
                 LIMIT ? OFFSET ?`,
                queryParams,
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });

        const totalPages = Math.ceil(totalCount / limit) || 1;

        res.json({
            events,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages
            },
            latestBlock
        });
    } catch (error) {
        console.error('Error fetching audit events:', error);
        res.status(500).json({ error: 'Failed to fetch audit events', details: error.message });
    }
};
