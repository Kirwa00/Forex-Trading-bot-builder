/**
 * Vercel serverless entry.
 *
 * `vercel.json` rewrites every /api/* request here, and the Express app routes
 * it from there. Static assets are served by Vercel from `dist/`, so this file
 * deliberately does not mount Vite or the static handler.
 */

import dotenv from 'dotenv';
import { createApp } from '../src/server/app';

dotenv.config();

export default createApp();
