# StratoBot AI

AI-assisted MetaTrader 5 Expert Advisor builder. Describe a strategy in plain
English, assemble it from "lego bricks", backtest it, and generate MQL5 source.

- Frontend: Vite + React 19 + Tailwind 4
- Backend: Express (`src/server/app.ts`), served two ways — see Deployment
- AI: Gemini, server-side only

## Local development

```bash
npm install
cp .env.example .env   # then fill in the values you need
npm run dev            # http://localhost:3000
```

The app runs without any keys: blueprint generation falls back to a sample
strategy, and the payment button reports that payments are not configured.

## Environment

See `.env.example` for the full list. Summary:

| Variable | Required for | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | AI blueprint + MQL5 repair | Falls back to a sample blueprint if unset |
| `APP_URL` | PesaPal callbacks | Inferred from the request host if unset |
| `PORT` | Self-hosting | Injected by most hosts; defaults to 3000 |
| `APP_SECRET` | Entitlement + admin cookies | 32+ random chars |
| `ADMIN_PASSWORD` | Operator surface at `/?view=admin` | Unset means admin is unreachable |
| `PESAPAL_CONSUMER_KEY` / `_SECRET` | Payments | From the PesaPal dashboard |
| `PESAPAL_ENV` | Payments | `sandbox` (default) or `live` |
| `PESAPAL_IPN_ID` | Payments | See below |

### Registering the PesaPal IPN URL

PesaPal needs one registered notification URL per deployment. Register it once
and store the returned id:

```bash
npm run register-ipn -- https://your-domain.com
```

This registers `https://your-domain.com/api/pesapal/ipn` and prints the
`PESAPAL_IPN_ID` to add to your environment.

## Payment flow

1. The client posts billing details to `POST /api/pesapal/checkout`. The server
   sets the price (`PRICING` in `src/server/app.ts`) — the amount is never taken
   from the request body.
2. The server calls PesaPal `SubmitOrderRequest` and returns their hosted
   checkout URL. The browser redirects there. **Card numbers and M-Pesa PINs are
   entered on PesaPal's page, never in this app.**
3. PesaPal notifies `POST /api/pesapal/ipn` server-to-server, and redirects the
   user back to `/?payment=return&OrderTrackingId=...`.
4. Both paths call `GetTransactionStatus` and only grant Pro when PesaPal
   reports `status_code === 1` and the amount covers the list price.
5. A successful verification sets an HMAC-signed `stratobot_entitlement` cookie.
   `GET /api/me/entitlement` is what the client reads on load.

The client cannot grant itself Pro. If PesaPal is unreachable or the credentials
are wrong, checkout fails loudly rather than succeeding.

## Deployment

### Vercel

`vercel.json` builds the frontend with `vite build` and routes `/api/*` to
`api/index.ts`, which exports the same Express app as a serverless function.
Set every environment variable above in the Vercel project settings.

### Self-hosted (Render, Railway, Fly, Cloud Run, VPS)

```bash
npm run build
NODE_ENV=production npm start
```

`server.ts` listens on `process.env.PORT`. `NODE_ENV=production` must be set, or
the server starts Vite in middleware mode instead of serving `dist/`.

## The user path

Four steps, in order, enforced by the nav — you can't jump ahead to a step you
haven't earned:

1. **Describe** — plain-English prompt with three one-click starters
2. **Tune** — the rules the AI picked, editable, plus risk settings
3. **Test** — backtest, led by a plain-money sentence rather than ratios
4. **Get your bot** — the `.mq5` download, Pro-gated, with MT5 install steps

`Examples` sits outside the path as a side entrance. Admin and the SDLC roadmap
are operator surfaces at `/?view=admin`, behind `ADMIN_PASSWORD`.

Building and testing are free. The paywall is at step 4 only: the source preview
truncates for free users, and `POST /api/download/mq5` returns 402 without a
valid Pro entitlement.

## Known gaps

These are real and should be closed before charging anyone:

- **Entitlements are stored in memory.** `src/server/store.ts` is an in-process
  `Map`. It does not survive a restart and is not shared between serverless
  instances, so on Vercel a paid user can lose Pro on the next cold start.
  Replace `InMemoryPaymentStore` with Postgres or Redis — the interface is
  deliberately narrow to keep that swap small.
- **No `.ex5` compilation.** The deliverable is `.mq5` source; MetaTrader
  compiles it locally on first attach. A server-side `.ex5` build needs
  MetaEditor on Windows. The UI says this plainly rather than faking it.
- **No user accounts.** The entitlement cookie proves a payment happened in this
  browser; copying the cookie copies the entitlement, and clearing it loses
  access with no way to restore it. The receipt shown after payment is the
  buyer's only record — it is not emailed anywhere.
- **The backtest runs on 100 bundled candles**, not live market history.
- **No automated tests.**
