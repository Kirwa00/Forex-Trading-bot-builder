import crypto from 'crypto';
import express, { Express } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { parseAndValidateMql5Code } from '../utils/astParser';
import { generateMql5FromBlueprint } from '../utils/mql5Generator';
import { StrategyBlueprint, StrategyCheck, PaymentTransaction } from '../types';
import {
  getTransactionStatus,
  isPesaPalConfigured,
  normalisePhone,
  PesaPalError,
  submitOrder,
} from './pesapal';
import { store } from './store';
import {
  buildAdminSetCookie,
  buildSetCookie,
  clearAdminCookie,
  isAdminRequest,
  issueAdminToken,
  issueToken,
  readTokenFromCookies,
  verifyToken,
} from './entitlementToken';

/** Server-authoritative pricing. Never trust an amount sent by the client. */
export const PRICING: Record<'KES' | 'USD', number> = { KES: 2500, USD: 20 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini GenAI server-side SDK
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'MOCK_KEY_FOR_DEV',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API 1: Generate Strategy Blueprint from Narrative Prompt using Gemini AI
  app.post('/api/generate-blueprint', async (req, res) => {
    try {
      const { prompt, currentSymbol = 'EURUSD', currentTimeframe = 'M15' } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Valid prompt string is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        // Fallback strategy when API key isn't provided
        const mockBp: StrategyBlueprint = {
          id: `bp-${Date.now()}`,
          title: 'AI Smart Money ICT Strategy',
          description: prompt,
          symbol: currentSymbol,
          timeframe: currentTimeframe,
          riskPercent: 1.0,
          fixedLot: 0.1,
          stopLossPips: 15,
          takeProfitPips: 45,
          useTrailingStop: true,
          trailingStopPips: 15,
          magicNumber: Math.floor(100000 + Math.random() * 800000),
          bricks: [
            { instanceId: 'b1', brickId: 'killzone', config: { session: 'London (08:00 - 11:00 EAT)', restrictTime: true } },
            { instanceId: 'b2', brickId: 'fvg', config: { minGapPips: 3, lookbackCandles: 10, fillRequirement: '50%' } },
            { instanceId: 'b3', brickId: 'ob', config: { minImpulseCandles: 2, requireMitigation: true } },
            { instanceId: 'b4', brickId: 'trailing_stop', config: { trailingPips: 15, stepPips: 5, useATR: false } }
          ],
          checkEntryLogic: 'CheckKillzone() && CheckFVG() && CheckOrderBlock()',
          checkExitLogic: 'ApplyTrailingStop()'
        };
        return res.json({ blueprint: mockBp });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Analyze the user's trading strategy narrative and output a structured JSON blueprint for MetaTrader 5 (MQL5) EA compilation.
User narrative: "${prompt}"

Select matching bricks from this list:
- "fvg" (Fair Value Gap)
- "ob" (Order Block)
- "pdh_pdl" (Previous Day High/Low)
- "killzone" (Session Killzone London/NY)
- "atr" (ATR Volatility Filter)
- "ma_cross" (EMA Cross)
- "engulfing" (Engulfing Candle)
- "sweep" (Liquidity Sweep)
- "fib" (Fibonacci OTE)
- "trailing_stop" (Trailing Stop Loss)

Map parameters appropriately with sensible trading defaults (stopLossPips: 10-30, takeProfitPips: 20-90, riskPercent: 1.0-2.0).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              symbol: { type: Type.STRING },
              timeframe: { type: Type.STRING },
              riskPercent: { type: Type.NUMBER },
              fixedLot: { type: Type.NUMBER },
              stopLossPips: { type: Type.INTEGER },
              takeProfitPips: { type: Type.INTEGER },
              useTrailingStop: { type: Type.BOOLEAN },
              trailingStopPips: { type: Type.INTEGER },
              brickIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              checkEntryLogic: { type: Type.STRING },
              checkExitLogic: { type: Type.STRING }
            },
            required: ['title', 'description', 'brickIds', 'stopLossPips', 'takeProfitPips']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');

      const brickIds: string[] = parsed.brickIds || ['fvg', 'killzone'];
      const bricks = brickIds.map((id, index) => ({
        instanceId: `inst-${index}-${Date.now()}`,
        brickId: id,
        config: id === 'fvg' ? { minGapPips: 3 } : id === 'killzone' ? { session: 'London' } : {}
      }));

      const blueprint: StrategyBlueprint = {
        id: `bp-${Date.now()}`,
        title: parsed.title || 'AI Strategy Blueprint',
        description: parsed.description || prompt,
        symbol: parsed.symbol || currentSymbol,
        timeframe: parsed.timeframe || currentTimeframe,
        riskPercent: parsed.riskPercent || 1.0,
        fixedLot: parsed.fixedLot || 0.1,
        stopLossPips: parsed.stopLossPips || 15,
        takeProfitPips: parsed.takeProfitPips || 45,
        useTrailingStop: parsed.useTrailingStop ?? true,
        trailingStopPips: parsed.trailingStopPips || 15,
        magicNumber: Math.floor(100000 + Math.random() * 800000),
        bricks,
        checkEntryLogic: parsed.checkEntryLogic || 'CheckBricksLogic()',
        checkExitLogic: parsed.checkExitLogic || 'ApplyTrailingStop()'
      };

      return res.json({ blueprint });
    } catch (err: any) {
      console.error('Error generating blueprint:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate blueprint.' });
    }
  });

  // API 2: Validate AST MQL5 Code Safety
  app.post('/api/validate-ast', (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code parameter is required.' });
    }

    const astResult = parseAndValidateMql5Code(code);
    return res.json({ astResult });
  });

  // API 3: Generate MQL5 Code & Apply AST Repair Loop
  app.post('/api/generate-code', async (req, res) => {
    try {
      const { blueprint } = req.body;
      if (!blueprint) {
        return res.status(400).json({ error: 'Blueprint is required.' });
      }

      let mql5Code = generateMql5FromBlueprint(blueprint as StrategyBlueprint);
      let astResult = parseAndValidateMql5Code(mql5Code);

      // If invalid, trigger AI AST Repair Prompt
      if (!astResult.isValid && process.env.GEMINI_API_KEY) {
        const repairResponse = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `The following MQL5 Expert Advisor code produced AST syntax/safety validation errors:
Errors:
${astResult.errors.map(e => `- Line ${e.line || '?'}: ${e.message}`).join('\n')}

Original MQL5 Code:
\`\`\`mql5
${mql5Code}
\`\`\`

Instructions:
1. Fix all legacy MQL4 functions (replace OrderSend with CTrade.Buy/Sell, remove Ask/Bid globals, replace with SymbolInfoDouble).
2. Ensure every lot size and price calculation uses NormalizeDouble().
3. Return ONLY the complete, corrected MQL5 code inside \`\`\`mql5 ... \`\`\` code fence.`,
        });

        const text = repairResponse.text || '';
        const match = text.match(/```(?:mql5|cpp)?([\s\S]*?)```/);
        if (match && match[1]) {
          mql5Code = match[1].trim();
          astResult = parseAndValidateMql5Code(mql5Code);
        }
      }

      return res.json({ mql5Code, astResult });
    } catch (err: any) {
      console.error('Error in code generation:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate MQL5 code.' });
    }
  });

  // API 4: Check the generated source before download.
  //
  // This runs the AST validator and reports exactly what it did — no VM, no
  // MetaEditor, no object-code step. Producing a real .ex5 needs MetaEditor on
  // Windows, which this deployment does not have; the deliverable is the .mq5
  // source, which MetaTrader compiles locally on first load.
  app.post('/api/check-strategy', (req, res) => {
    const { mql5Code } = req.body;
    if (!mql5Code || typeof mql5Code !== 'string') {
      return res.status(400).json({ error: 'mql5Code is required.' });
    }

    const startedAt = Date.now();
    const astResult = parseAndValidateMql5Code(mql5Code);

    const result: StrategyCheck = {
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      passed: astResult.isValid,
      errorCount: astResult.errors.filter((e) => e.severity === 'error').length,
      warningCount: astResult.errors.filter((e) => e.severity === 'warning').length,
      lineCount: mql5Code.split('\n').length,
      byteSize: Buffer.byteLength(mql5Code, 'utf8'),
      checks: astResult.passedRules,
      problems: astResult.errors.map((e) => ({
        severity: e.severity,
        line: e.line,
        message: e.message,
      })),
    };

    return res.json({ result });
  });

  // API 5: The actual deliverable. Pro-gated — this is the paywall.
  app.post('/api/download/mq5', async (req, res) => {
    const payload = verifyToken(readTokenFromCookies(req.headers.cookie));
    let tier = payload?.tier ?? 'Free';
    if (payload) {
      const entitlement = await store.getEntitlement(payload.email);
      tier = entitlement?.tier ?? payload.tier;
    }

    if (tier !== 'Pro') {
      return res.status(402).json({
        error: 'This download is part of StratoBot Pro.',
        tier: 'Free',
      });
    }

    const { blueprint } = req.body;
    if (!blueprint?.title) {
      return res.status(400).json({ error: 'A strategy blueprint is required.' });
    }

    const mql5Code = generateMql5FromBlueprint(blueprint as StrategyBlueprint);
    const filename = `${String(blueprint.title).replace(/[^a-z0-9]+/gi, '_').slice(0, 60) || 'StratoBot_EA'}.mq5`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(mql5Code);
  });

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  app.get('/api/admin/session', (req, res) => {
    res.json({
      authenticated: isAdminRequest(req.headers.cookie),
      configured: Boolean(process.env.ADMIN_PASSWORD),
    });
  });

  app.post('/api/admin/login', (req, res) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return res.status(503).json({ error: 'Admin access is not configured on this deployment.' });
    }

    const supplied = String(req.body?.password ?? '');
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!ok) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    res.setHeader('Set-Cookie', buildAdminSetCookie(issueAdminToken()));
    return res.json({ authenticated: true });
  });

  app.post('/api/admin/logout', (_req, res) => {
    res.setHeader('Set-Cookie', clearAdminCookie());
    return res.json({ authenticated: false });
  });

  // ---------------------------------------------------------------------------
  // PesaPal
  // ---------------------------------------------------------------------------

  function appUrl(req: express.Request): string {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    return `${proto}://${req.get('host')}`;
  }

  /**
   * Applies a verified PesaPal status to the store and, when the payment
   * completed, grants the Pro entitlement. Shared by the IPN and status routes
   * so both paths converge on the same result.
   */
  async function reconcile(orderTrackingId: string) {
    const status = await getTransactionStatus(orderTrackingId);
    const existing =
      (await store.getTransactionByTrackingId(orderTrackingId)) ||
      (await store.getTransactionByReference(status.merchant_reference));

    const mapped: PaymentTransaction['status'] =
      status.status_code === 1 ? 'COMPLETED' : status.status_code === 2 || status.status_code === 3 ? 'FAILED' : 'PENDING';

    const txn: PaymentTransaction = {
      merchantReference: status.merchant_reference,
      pesapalTrackingId: orderTrackingId,
      status: mapped,
      amount: status.amount ?? existing?.amount ?? 0,
      currency: (status.currency as 'KES' | 'USD') || existing?.currency || 'KES',
      phoneNumber: existing?.phoneNumber,
      email: existing?.email,
      createdAt: existing?.createdAt || new Date().toISOString(),
      confirmationCode: status.confirmation_code,
      paymentMethod: status.payment_method,
    };
    await store.putTransaction(txn);

    if (mapped === 'COMPLETED') {
      // Guard against a completed callback for an amount below the list price.
      const expected = PRICING[txn.currency];
      if (expected !== undefined && txn.amount + 0.001 < expected) {
        console.warn(
          `[PesaPal] Underpayment on ${txn.merchantReference}: paid ${txn.amount} ${txn.currency}, expected ${expected}. Entitlement withheld.`
        );
        return { txn, status, granted: false };
      }

      const email = txn.email;
      if (email) {
        await store.grantEntitlement({
          email,
          tier: 'Pro',
          grantedAt: new Date().toISOString(),
          merchantReference: txn.merchantReference,
          confirmationCode: status.confirmation_code,
        });
      }
      return { txn, status, granted: Boolean(email) };
    }

    return { txn, status, granted: false };
  }

  // Creates a real PesaPal order and hands back their hosted checkout URL.
  app.post('/api/pesapal/checkout', async (req, res) => {
    try {
      if (!isPesaPalConfigured()) {
        return res.status(503).json({
          error: 'Payments are not configured on this deployment.',
        });
      }

      const { phoneNumber, email, firstName, lastName, currency } = req.body || {};

      if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return res.status(400).json({ error: 'A phone number is required.' });
      }
      if (currency !== 'KES' && currency !== 'USD') {
        return res.status(400).json({ error: 'Currency must be KES or USD.' });
      }

      const normalisedPhone = normalisePhone(phoneNumber);
      if (!/^\d{9,15}$/.test(normalisedPhone)) {
        return res.status(400).json({ error: 'That phone number does not look valid.' });
      }

      // Price is set here, not by the caller.
      const amount = PRICING[currency];
      const merchantReference = `STRATOBOT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const order = await submitOrder({
        merchantReference,
        amount,
        currency,
        description: 'StratoBot AI Pro — lifetime access',
        callbackUrl: `${appUrl(req)}/?payment=return`,
        email,
        phoneNumber: normalisedPhone,
        firstName: (firstName || 'StratoBot').toString().slice(0, 50),
        lastName: (lastName || 'Customer').toString().slice(0, 50),
      });

      await store.putTransaction({
        merchantReference,
        pesapalTrackingId: order.order_tracking_id,
        status: 'PENDING',
        amount,
        currency,
        phoneNumber: normalisedPhone,
        email,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        redirectUrl: order.redirect_url,
        merchantReference,
        orderTrackingId: order.order_tracking_id,
      });
    } catch (err: any) {
      console.error('PesaPal checkout failed:', err);
      const message =
        err instanceof PesaPalError ? err.message : 'Could not start checkout. Please try again.';
      return res.status(502).json({ error: message });
    }
  });

  // PesaPal calls this server-to-server when a transaction changes state.
  const ipnHandler: express.RequestHandler = async (req, res) => {
    const source = req.method === 'GET' ? req.query : req.body;
    const orderTrackingId = (source?.OrderTrackingId || source?.orderTrackingId) as string;
    const merchantReference = (source?.OrderMerchantReference || source?.orderMerchantReference) as string;
    const notificationType = (source?.OrderNotificationType || source?.orderNotificationType) as string;

    if (!orderTrackingId) {
      return res.status(400).json({ error: 'OrderTrackingId is required.' });
    }

    try {
      await reconcile(orderTrackingId);
      // PesaPal expects this exact acknowledgement shape.
      return res.json({
        orderNotificationType: notificationType,
        orderTrackingId,
        orderMerchantReference: merchantReference,
        status: 200,
      });
    } catch (err) {
      console.error('PesaPal IPN reconcile failed:', err);
      // A non-200 status tells PesaPal to retry the notification.
      return res.json({
        orderNotificationType: notificationType,
        orderTrackingId,
        orderMerchantReference: merchantReference,
        status: 500,
      });
    }
  };

  app.get('/api/pesapal/ipn', ipnHandler);
  app.post('/api/pesapal/ipn', ipnHandler);

  // Browser-facing verification after PesaPal redirects the user back.
  app.get('/api/pesapal/status', async (req, res) => {
    const orderTrackingId = req.query.orderTrackingId as string;
    if (!orderTrackingId) {
      return res.status(400).json({ error: 'orderTrackingId is required.' });
    }

    try {
      const { txn, status, granted } = await reconcile(orderTrackingId);

      if (txn.status === 'COMPLETED' && granted && txn.email) {
        res.setHeader(
          'Set-Cookie',
          buildSetCookie(
            issueToken({ email: txn.email, tier: 'Pro', merchantReference: txn.merchantReference })
          )
        );
      }

      return res.json({
        status: txn.status,
        description: status.payment_status_description,
        confirmationCode: status.confirmation_code,
        paymentMethod: txn.paymentMethod,
        amount: txn.amount,
        currency: txn.currency,
        merchantReference: txn.merchantReference,
        tier: txn.status === 'COMPLETED' && granted ? 'Pro' : 'Free',
      });
    } catch (err: any) {
      console.error('PesaPal status check failed:', err);
      return res.status(502).json({ error: 'Could not verify payment status.' });
    }
  });

  // What the client asks on load to find out which tier this browser has.
  app.get('/api/me/entitlement', async (req, res) => {
    const payload = verifyToken(readTokenFromCookies(req.headers.cookie));
    if (!payload) return res.json({ tier: 'Free' });

    // The cookie asserts the tier; the store is authoritative when it still
    // holds the record (it will not after a serverless cold start).
    const entitlement = await store.getEntitlement(payload.email);
    return res.json({
      tier: entitlement?.tier || payload.tier,
      email: payload.email,
    });
  });

  return app;
}
