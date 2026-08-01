/**
 * One-off helper: registers this deployment's IPN URL with PesaPal and prints
 * the id to paste into PESAPAL_IPN_ID.
 *
 *   npm run register-ipn                       # uses APP_URL from .env
 *   npm run register-ipn -- https://foo.app    # or pass the origin explicitly
 */

import dotenv from 'dotenv';
import { registerIpn } from '../src/server/pesapal';

dotenv.config();

async function main() {
  const origin = (process.argv[2] || process.env.APP_URL || '').replace(/\/$/, '');
  if (!origin) {
    console.error('Set APP_URL in .env or pass the origin as an argument.');
    process.exit(1);
  }

  const url = `${origin}/api/pesapal/ipn`;
  const ipnId = await registerIpn(url);

  console.log(`Registered IPN URL: ${url}`);
  console.log(`\nAdd this to your environment:\n\n  PESAPAL_IPN_ID=${ipnId}\n`);
}

main().catch((err) => {
  console.error('IPN registration failed:', err.message, err.detail ?? '');
  process.exit(1);
});
