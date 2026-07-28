import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { parseAndValidateMql5Code } from './src/utils/astParser';
import { generateMql5FromBlueprint } from './src/utils/mql5Generator';
import { StrategyBlueprint, CompilationJob, PaymentTransaction } from './src/types';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

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
        // Fallback fallback strategy when API key isn't provided
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

  // API 4: Simulate Azure Windows VM MetaEditor CLI Compilation Job (BullMQ / Redis agent)
  app.post('/api/compile-job', (req, res) => {
    const { mql5Code, strategyTitle = 'StratoBot_EA' } = req.body;

    const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const queuedAt = new Date().toISOString();
    const vmInstance = 'azure-win-spot-b2s-nairobi-01';
    const metaeditorVersion = 'MetaEditor 5 (Build 4012 x64)';

    const astResult = parseAndValidateMql5Code(mql5Code || '');

    const logs = [
      `[Redis-BullMQ] Job ${jobId} pushed to queue 'mql5-compilation-jobs'`,
      `[Azure-Agent] Worker connected to ${vmInstance} via secure WebSocket bridge`,
      `[MetaEditor-CLI] Executing: "C:\\Program Files\\MetaTrader 5\\metaeditor64.exe" /compile:"C:\\Builds\\${strategyTitle}.mq5" /log:"C:\\Builds\\${strategyTitle}.log" /inc:"C:\\MQL5\\Include"`,
      `[MetaEditor-CLI] Parsing includes: CTrade.mqh, Trade.mqh, SymbolInfo.mqh`,
      `[MetaEditor-CLI] AST Safety Check: ${astResult.isValid ? 'PASSED (0 Fatal Errors)' : 'FAILED (' + astResult.errors.length + ' Errors)'}`,
    ];

    if (astResult.isValid) {
      logs.push(
        `[MetaEditor-CLI] Generating binary artifact: C:\\Builds\\${strategyTitle}.ex5`,
        `[Cloudflare-R2] Uploading ${strategyTitle}.ex5 to R2 bucket 'stratobot-compiled-eas'`,
        `[Cloudflare-R2] Generated signed download URL (24hr TTL expires ${new Date(Date.now() + 86400000).toISOString()})`,
        `[Compilation-Status] Result: 0 errors, 0 warnings. Compilation finished in 4,820 ms.`
      );

      const job: CompilationJob = {
        jobId,
        status: 'success',
        queuedAt,
        completedAt: new Date().toISOString(),
        durationMs: 4820,
        vmInstance,
        metaeditorVersion,
        mql5ErrorsCount: 0,
        mql5WarningsCount: 0,
        logs,
        ex5DownloadUrl: `/api/download/${strategyTitle}.ex5`,
        mq5DownloadUrl: `/api/download/${strategyTitle}.mq5`,
        expiresInSeconds: 86400
      };
      return res.json({ job });
    } else {
      logs.push(
        `[MetaEditor-CLI] Compilation failed! Error log output:`,
        ...astResult.errors.map(e => `ERR_COMPILER: Line ${e.line || '?'}: ${e.message}`),
        `[Retry-Agent] Triggering automatic AST repair re-queue in 2,000 ms...`
      );

      const job: CompilationJob = {
        jobId,
        status: 'failed',
        queuedAt,
        completedAt: new Date().toISOString(),
        durationMs: 3120,
        vmInstance,
        metaeditorVersion,
        mql5ErrorsCount: astResult.errors.filter(e => e.severity === 'error').length,
        mql5WarningsCount: astResult.errors.filter(e => e.severity === 'warning').length,
        logs
      };
      return res.json({ job });
    }
  });

  // API 5: PesaPal M-Pesa Payment Checkout Simulation
  app.post('/api/pesapal/checkout', (req, res) => {
    const { phoneNumber = '+254712345678', amount = 2500, currency = 'KES' } = req.body;

    const merchantReference = `STRATOBOT-${Date.now()}`;
    const pesapalTrackingId = `PESAPAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const transaction: PaymentTransaction = {
      merchantReference,
      pesapalTrackingId,
      status: 'COMPLETED',
      amount,
      currency,
      phoneNumber,
      createdAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      transaction,
      message: `M-Pesa STK push sent to ${phoneNumber}. Transaction ${pesapalTrackingId} verified successfully! Pro Tier unlocked.`,
      tier: 'Pro',
      downloadsUsedThisHour: 0,
      hourlyLimit: 9999
    });
  });

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
