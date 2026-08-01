/**
 * Standalone server entry — local dev and any host that runs a long-lived Node
 * process (Render, Railway, Fly, Cloud Run, a VPS).
 *
 * Vercel does not use this file; it loads `api/index.ts` as a serverless
 * function instead. Route definitions live in `src/server/app.ts` so both
 * entries serve exactly the same API.
 */

import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './src/server/app';

dotenv.config();

async function startServer() {
  const app = createApp();

  // Hosts assign the port via the environment; 3000 is only a local fallback.
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware setup for dev & prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StratoBot AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
