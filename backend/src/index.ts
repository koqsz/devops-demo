import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase, checkDatabaseConnection } from './db/connection';
import tasksRouter from './routes/tasks';
import os from 'os';

const app = express();

app.use(cors());
app.use(express.json());

// Health check - életjel ellenőrzés
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness check - adatbázis kapcsolat ellenőrzés
app.get('/ready', async (_req, res) => {
  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    res.json({ status: 'ready', db: 'connected' });
  } else {
    res.status(503).json({ status: 'not ready', db: 'disconnected' });
  }
});

// Info - alkalmazás információk (hasznos K8s-ben a pod azonosításhoz)
app.get('/api/info', (_req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    hostname: os.hostname(),
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Task routes
app.use('/api/tasks', tasksRouter);

// Szerver indítása
async function start() {
  try {
    await initDatabase();
    app.listen(config.port, () => {
      console.log(`Backend running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
