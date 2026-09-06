import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../database.sqlite');
let db;

export async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database', err);
                reject(err);
            } else {
                console.log('Database connected.');
                db.run(`CREATE TABLE IF NOT EXISTS certificates (
                    id TEXT PRIMARY KEY,
                    studentName TEXT,
                    courseName TEXT,
                    issueDate TEXT,
                    institutionId TEXT,
                    status TEXT
                )`, (err) => {
                    if (err) return reject(err);
                    
                    db.run(`CREATE TABLE IF NOT EXISTS verification_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        certificateId TEXT,
                        timestamp TEXT,
                        status TEXT,
                        ipAddress TEXT,
                        userAgent TEXT
                    )`, (logErr) => {
                        if (logErr) return reject(logErr);

                        db.run(`CREATE TABLE IF NOT EXISTS blockchain_events (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            eventType TEXT NOT NULL,
                            certificateId TEXT,
                            institutionId TEXT,
                            issuer TEXT,
                            timestamp TEXT NOT NULL,
                            blockNumber INTEGER NOT NULL,
                            transactionHash TEXT NOT NULL,
                            logIndex INTEGER NOT NULL,
                            version INTEGER,
                            UNIQUE(transactionHash, logIndex)
                        )`, (eventErr) => {
                            if (eventErr) return reject(eventErr);

                            db.run(`CREATE INDEX IF NOT EXISTS idx_events_type ON blockchain_events(eventType)`, () => {
                                db.run(`CREATE INDEX IF NOT EXISTS idx_events_cert ON blockchain_events(certificateId)`, () => {
                                    db.run(`CREATE INDEX IF NOT EXISTS idx_events_inst ON blockchain_events(institutionId)`, () => {
                                        db.run(`CREATE INDEX IF NOT EXISTS idx_events_ts ON blockchain_events(timestamp)`, () => {
                                            resolve();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
        });
    });
}

export function getDb() {
    return db;
}
