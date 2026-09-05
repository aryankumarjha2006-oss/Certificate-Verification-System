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
                    if (err) reject(err);
                    else resolve();
                });
            }
        });
    });
}

export function getDb() {
    return db;
}
