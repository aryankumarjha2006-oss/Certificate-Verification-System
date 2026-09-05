import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectBlockchain } from './src/config/blockchain.js';
import { initializeDatabase } from './src/config/database.js';
import certificateRoutes from './src/routes/certificateRoutes.js';
import { startEventSynchronizer } from './src/services/eventListener.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static('public'));

app.use('/api/certificates', certificateRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log('Initializing Database...');
        await initializeDatabase();

        console.log('Connecting to Blockchain...');
        await connectBlockchain();

        console.log('Starting Event Synchronizer...');
        await startEventSynchronizer();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
