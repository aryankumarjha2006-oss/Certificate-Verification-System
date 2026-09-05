import { getCertificateRegistryContract } from '../config/blockchain.js';
import { getDb } from '../config/database.js';
import { ethers } from 'ethers';

export async function startEventSynchronizer() {
    const registry = getCertificateRegistryContract();
    
    registry.on('CertificateIssued', (certificateId, certificateHash, issuer, expiryTimestamp, version, event) => {
        console.log(`Event [CertificateIssued]`);
    });

    registry.on('CertificateRevoked', (certIdOrTopic, event) => {
        const topic = (typeof certIdOrTopic === 'string') ? certIdOrTopic : (event && event.log ? event.log.topics[1] : null);
        console.log(`Event [CertificateRevoked], identifier/topic: ${topic}`);
        
        const db = getDb();
        db.all('SELECT id FROM certificates', [], (err, rows) => {
            if (err || !rows) return;
            for (const row of rows) {
                // If direct match OR topic matches keccak256 of row.id
                if (row.id === topic || (topic && ethers.id(row.id) === topic)) {
                    db.run('UPDATE certificates SET status = ? WHERE id = ?', ['REVOKED', row.id], (uErr) => {
                        if (uErr) console.error('Error updating DB on revoke event:', uErr);
                        else console.log(`Successfully synchronized certificate ${row.id} to REVOKED in SQLite.`);
                    });
                }
            }
        });
    });

    registry.on('CertificateVersionCreated', (certificateId, newCertificateHash, newExpiryTimestamp, newVersion, event) => {
        console.log(`Event [CertificateVersionCreated]: Version ${newVersion}`);
    });
}
