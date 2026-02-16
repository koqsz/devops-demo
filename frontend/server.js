import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3000';

// API proxy a backend felé
app.use(createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathFilter: ['/api', '/health', '/ready'],
}));

// Statikus fájlok
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback - minden egyéb kérés az index.html-re megy
app.get('*', (req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

app.listen(5000, () => console.log('Frontend running on port 5000'));
