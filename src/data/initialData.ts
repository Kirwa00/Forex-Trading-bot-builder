import { LegoBrick, VideoCard, Candle, SdlcPhase } from '../types';

export const INITIAL_LEGO_BRICKS: LegoBrick[] = [
  {
    id: 'fvg',
    name: 'Fair Value Gap (FVG)',
    codeName: 'CheckFVG',
    category: 'entry',
    description: 'Detects 3-candle imbalance gaps where price moved aggressively leaving inefficient liquidity.',
    iconName: 'Zap',
    defaultConfig: { minGapPips: 3, lookbackCandles: 10, fillRequirement: '50%' }
  },
  {
    id: 'ob',
    name: 'Order Block (OB)',
    codeName: 'CheckOrderBlock',
    category: 'entry',
    description: 'Identifies institutional order blocks (last down candle before strong rally or up candle before drop).',
    iconName: 'Box',
    defaultConfig: { minImpulseCandles: 2, requireMitigation: true }
  },
  {
    id: 'pdh_pdl',
    name: 'PDH / PDL High & Low',
    codeName: 'CheckPDHPDL',
    category: 'filter',
    description: 'Filters entries based on sweep or break of Previous Day High (PDH) or Previous Day Low (PDL).',
    iconName: 'TrendingUp',
    defaultConfig: { bufferPips: 2, action: 'Sweep' }
  },
  {
    id: 'killzone',
    name: 'Session Killzone',
    codeName: 'CheckKillzone',
    category: 'filter',
    description: 'Limits order execution to specific high-volume volatility windows (London, New York, Asia).',
    iconName: 'Clock',
    defaultConfig: { session: 'London (08:00 - 11:00 EAT)', restrictTime: true }
  },
  {
    id: 'atr',
    name: 'ATR Volatility Filter',
    codeName: 'CheckATR',
    category: 'filter',
    description: 'Ensures market expansion with Average True Range above minimum baseline.',
    iconName: 'Activity',
    defaultConfig: { atrPeriod: 14, minAtrPips: 8.5 }
  },
  {
    id: 'ma_cross',
    name: 'EMA Dynamic Cross',
    codeName: 'CheckMACross',
    category: 'entry',
    description: 'Classic trend momentum filter or trigger based on fast and slow Exponential Moving Averages.',
    iconName: 'GitCommit',
    defaultConfig: { fastPeriod: 9, slowPeriod: 21 }
  },
  {
    id: 'engulfing',
    name: 'Bullish / Bearish Engulfing',
    codeName: 'CheckEngulfing',
    category: 'pattern',
    description: 'Requires current candle body to fully engulf previous candle body at key zone.',
    iconName: 'Maximize2',
    defaultConfig: { minBodyPips: 4.0, requireCloseConfirmation: true }
  },
  {
    id: 'sweep',
    name: 'Liquidity Sweep',
    codeName: 'CheckLiquiditySweep',
    category: 'entry',
    description: 'Triggers counter-trend setup when price sweeps equal highs/lows and immediately rejects.',
    iconName: 'Target',
    defaultConfig: { sweepDepthPips: 3.0, maxWickRatio: 0.6 }
  },
  {
    id: 'fib',
    name: 'Fibonacci OTE (50% - 61.8%)',
    codeName: 'CheckFibOTE',
    category: 'filter',
    description: 'Requires entry to occur inside Optimal Trade Entry (OTE) retracement level.',
    iconName: 'Sliders',
    defaultConfig: { levelMin: 0.50, levelMax: 0.618 }
  },
  {
    id: 'trailing_stop',
    name: 'ATR Dynamic Trailing Stop',
    codeName: 'ApplyTrailingStop',
    category: 'risk',
    description: 'Locks in profit automatically as trade advances by trailing SL behind market.',
    iconName: 'ShieldCheck',
    defaultConfig: { trailingPips: 15, stepPips: 5, useATR: false }
  }
];

export const INITIAL_VIDEOS: VideoCard[] = [
  {
    id: 'vid-1',
    title: 'London Killzone FVG + OB Master Strategy (84% Win Rate)',
    creator: 'ICT Trade Lab East Africa',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '1:45',
    badge: 'ICT / SMC Concept',
    concept: 'London Killzone + Fair Value Gap + Order Block',
    winRateEst: '78% - 84%',
    blueprint: {
      id: 'bp-london-fvg',
      title: 'ICT London Killzone FVG & OB EA',
      description: 'Executes trades during London Killzone (08:00 - 11:00 EAT) when price taps a 3-candle FVG inside an unmitigated Order Block.',
      symbol: 'EURUSD',
      timeframe: 'M15',
      riskPercent: 1.0,
      fixedLot: 0.1,
      stopLossPips: 15,
      takeProfitPips: 45,
      useTrailingStop: true,
      trailingStopPips: 15,
      magicNumber: 108801,
      bricks: [
        {
          instanceId: 'b-1',
          brickId: 'killzone',
          config: { session: 'London (08:00 - 11:00 EAT)', restrictTime: true }
        },
        {
          instanceId: 'b-2',
          brickId: 'fvg',
          config: { minGapPips: 3, lookbackCandles: 10, fillRequirement: '50%' }
        },
        {
          instanceId: 'b-3',
          brickId: 'ob',
          config: { minImpulseCandles: 2, requireMitigation: true }
        },
        {
          instanceId: 'b-4',
          brickId: 'trailing_stop',
          config: { trailingPips: 15, stepPips: 5, useATR: false }
        }
      ],
      checkEntryLogic: 'CheckKillzone() && CheckFVG() && CheckOrderBlock()',
      checkExitLogic: 'CheckTrailingStop() || PriceTargetHit()'
    }
  },
  {
    id: 'vid-2',
    title: 'New York Silver Bullet Scalper (M5 Execution)',
    creator: 'Nairobi Forex Traders',
    thumbnailUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2:10',
    badge: 'Silver Bullet',
    concept: 'NY Session 10am-11am + PDH Sweep + Engulfing',
    winRateEst: '72% - 80%',
    blueprint: {
      id: 'bp-silver-bullet',
      title: 'NY Silver Bullet Liquidity Scalper',
      description: 'Waits for Previous Day High/Low liquidity sweep between 10am-11am NY time followed by a strong engulfing candle.',
      symbol: 'GBPUSD',
      timeframe: 'M5',
      riskPercent: 1.5,
      fixedLot: 0.15,
      stopLossPips: 12,
      takeProfitPips: 36,
      useTrailingStop: false,
      trailingStopPips: 0,
      magicNumber: 204402,
      bricks: [
        {
          instanceId: 'b-201',
          brickId: 'pdh_pdl',
          config: { bufferPips: 2, action: 'Sweep' }
        },
        {
          instanceId: 'b-202',
          brickId: 'engulfing',
          config: { minBodyPips: 4.0, requireCloseConfirmation: true }
        },
        {
          instanceId: 'b-203',
          brickId: 'atr',
          config: { atrPeriod: 14, minAtrPips: 8.0 }
        }
      ],
      checkEntryLogic: 'CheckPDHPDL() && CheckEngulfing() && CheckATR()',
      checkExitLogic: 'FixedSLTP()'
    }
  },
  {
    id: 'vid-3',
    title: 'Gold (XAUUSD) OTE 50% Fib Sweep EA',
    creator: 'Dar Es Salaam Quant',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '1:15',
    badge: 'Gold Strategy',
    concept: 'XAUUSD 50% Fib OTE + ATR Volatility',
    winRateEst: '75% - 82%',
    blueprint: {
      id: 'bp-gold-ote',
      title: 'Gold OTE Retracement EA',
      description: 'Specialized Gold EA that buys 50-61.8% Fibonacci pullbacks during volatile sessions with trailing protection.',
      symbol: 'XAUUSD',
      timeframe: 'M15',
      riskPercent: 2.0,
      fixedLot: 0.05,
      stopLossPips: 25,
      takeProfitPips: 75,
      useTrailingStop: true,
      trailingStopPips: 20,
      magicNumber: 309903,
      bricks: [
        {
          instanceId: 'b-301',
          brickId: 'fib',
          config: { levelMin: 0.50, levelMax: 0.618 }
        },
        {
          instanceId: 'b-302',
          brickId: 'atr',
          config: { atrPeriod: 14, minAtrPips: 15.0 }
        },
        {
          instanceId: 'b-303',
          brickId: 'trailing_stop',
          config: { trailingPips: 20, stepPips: 5, useATR: true }
        }
      ],
      checkEntryLogic: 'CheckFibOTE() && CheckATR()',
      checkExitLogic: 'ApplyTrailingStop()'
    }
  }
];

export const SDLC_PHASES: SdlcPhase[] = [
  {
    id: 0,
    name: 'Phase 0: The Spelunking (Windows VM & Compiler Agent)',
    weeks: 'Weeks 1 - 2',
    goal: 'Prove headless MQL5 EA compilation on Azure Windows VM without human MetaEditor interaction.',
    status: 'completed',
    deliverables: [
      'Azure Windows Spot VM instance (B2s 2vCPU, Windows Server 2022)',
      'MetaEditor 5 CLI path integration (metaeditor64.exe /compile)',
      'Python Subprocess Compiler Agent (<12s compile target)',
      'Redis BullMQ Queue & WebSocket job listener'
    ],
    gatingCriteria: [
      { criterion: 'VM accessible via RDP & SSH', passed: true },
      { criterion: 'metaeditor64.exe runs without GUI prompts', passed: true },
      { criterion: '100 static .mq5 files compile in <12 seconds each', passed: true },
      { criterion: 'Windows Auto-Updates disabled via GPO', passed: true }
    ]
  },
  {
    id: 1,
    name: 'Phase 1: Core Master Wrapper & AI AST Parser',
    weeks: 'Weeks 3 - 6',
    goal: 'Prevent LLM syntax hallucinations and enforce strict MQL5 code safety using AST Parser validation.',
    status: 'completed',
    deliverables: [
      'Master Wrapper V1 template C++ class (CTrade, OnTick, CopyBuffer)',
      'Prompt Engineering Service (JSON Strategy Blueprint Generator)',
      'AST Parser (Rejects OrderSend MQL4 legacy functions & enforces NormalizeDouble)',
      'Gemini AI auto-repair loop for failed compilations'
    ],
    gatingCriteria: [
      { criterion: 'Master Wrapper base compiles flawlessly in MetaEditor 5', passed: true },
      { criterion: 'AST Parser rejects unsafe MQL4 functions (OrderSend, Ask, Bid)', passed: true },
      { criterion: 'Automatic prompt re-injection fixes syntax errors in 1 attempt', passed: true },
      { criterion: 'Claude/Gemini AI outputs strictly CheckEntry() and CheckExit()', passed: true }
    ]
  },
  {
    id: 2,
    name: 'Phase 2: Frontend & Video Research Hub',
    weeks: 'Weeks 7 - 10',
    goal: 'Deliver Lego Block Strategy Builder and Video Hub with instant 1-Click strategy loading.',
    status: 'completed',
    deliverables: [
      'Next.js/React + Tailwind mobile-first PWA dashboard',
      '10 Core Modular Lego Strategy Bricks (FVG, OB, Killzone, ATR, etc.)',
      'Video Research Hub featuring YouTube Shorts & SMC tutorials',
      'One-Click Strategy Blueprint Auto-Populate feature'
    ],
    gatingCriteria: [
      { criterion: 'Lighthouse Mobile score > 80, fast page render < 3s', passed: true },
      { criterion: 'User can build a 3-brick strategy in < 2 minutes on mobile', passed: true },
      { criterion: 'One-Click Load populates JSON state in < 50ms without API call', passed: true }
    ]
  },
  {
    id: 3,
    name: 'Phase 3: Strategy Simulation Engine',
    weeks: 'Weeks 11 - 13',
    goal: 'Provide visual confidence via interactive candlestick chart backtester with entry/exit signal arrows.',
    status: 'completed',
    deliverables: [
      'Interactive Candlestick Chart component with OHLC & MAs',
      '100-candle Backtesting engine with Buy/Sell arrow overlays',
      'Metrics Dashboard: Net P&L (KES/USD), Win Rate %, Max Drawdown %, Sharpe Ratio'
    ],
    gatingCriteria: [
      { criterion: 'Renders 100 historical candles smoothly with signal markers', passed: true },
      { criterion: 'Backtest simulation finishes in < 5 seconds', passed: true },
      { criterion: 'Arrows match MT5 strategy tester logic accurately', passed: true }
    ]
  },
  {
    id: 4,
    name: 'Phase 4: Monetization & Async Pipeline (PesaPal)',
    weeks: 'Weeks 14 - 16',
    goal: 'Connect M-Pesa payments (PesaPal), Redis Job Queue, and Cloudflare R2 storage for EA download links.',
    status: 'in_progress',
    deliverables: [
      'PesaPal M-Pesa STK Push & Card checkout integration (2,500 KES / $20)',
      'Async Redis BullMQ job worker for compilation dispatch',
      'Cloudflare R2 signed download URLs for .mq5 and .ex5 files (24h TTL)',
      'Compilation Retry engine for self-healing code generation'
    ],
    gatingCriteria: [
      { criterion: 'Test 2,500 KES transaction upgrades user tier to Pro', passed: true },
      { criterion: 'End-to-End latency (Click to Download) is < 60 seconds', passed: true },
      { criterion: 'Compiled binary files auto-expire after 24 hours', passed: true }
    ]
  },
  {
    id: 5,
    name: 'Phase 5: Beta Hardening',
    weeks: 'Weeks 17 - 18',
    goal: 'Test with 20 EA traders in Nairobi/Dar Es Salaam, enforce rate limits, monitor infrastructure.',
    status: 'planned',
    deliverables: [
      'Beta onboarding program for Nairobi & Dar traders',
      'Rate limiting middleware (5 gens/hr Free vs Unlimited Pro)',
      'Sentry + Datadog telemetry for Azure VM load & queue monitoring'
    ],
    gatingCriteria: [
      { criterion: '20 beta users successfully load .ex5 into MT5 Experts folder', passed: false },
      { criterion: 'Rate limit prevents abusive OpenAI/Gemini API spend', passed: true }
    ]
  },
  {
    id: 6,
    name: 'Phase 6: EA Market Launch',
    weeks: 'Weeks 19 - 20',
    goal: 'Public launch with Terraform auto-scaling during London-NY overlap session.',
    status: 'planned',
    deliverables: [
      'K6 Load Testing for 100 concurrent EA compilations',
      'Terraform Auto-Scaling Azure Spot VMs for peak trading hours',
      'SEO & Forex community PR campaign'
    ],
    gatingCriteria: [
      { criterion: '100 concurrent compile jobs processed without 502 errors', passed: false },
      { criterion: 'Peak infra costs remain < $50/month', passed: true }
    ]
  }
];

export const MASTER_WRAPPER_MQL5_TEMPLATE = `//+------------------------------------------------------------------+
//|                                              StratoBot_Master.mq5|
//|                        Copyright 2026, StratoBot AI EA Generator |
//|                                           https://stratobot.ai   |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, StratoBot AI"
#property link      "https://stratobot.ai"
#property version   "1.00"
#property description "Generated via StratoBot AI Master Wrapper v1.0"

#include <Trade\\Trade.mqh>

//--- Input Parameters
input group "=== StratoBot Strategy Settings ==="
input double   InpRiskPercent    = 1.0;        // Risk % per trade
input double   InpFixedLot       = 0.1;        // Fixed Lot (if Risk% = 0)
input int      InpStopLossPips   = 15;         // Stop Loss in Pips
input int      InpTakeProfitPips = 45;         // Take Profit in Pips
input bool     InpUseTrailing    = true;       // Enable Trailing Stop
input int      InpTrailingPips   = 15;         // Trailing Stop Distance
input ulong    InpMagicNumber    = 108801;     // EA Magic Number

//--- Global Variables
CTrade         m_trade;
int            m_atrHandle;
double         m_atrBuffer[];

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   m_trade.SetExpertMagicNumber(InpMagicNumber);
   m_trade.SetMarginMode();
   
   m_atrHandle = iATR(_Symbol, _Period, 14);
   if(m_atrHandle == INVALID_HANDLE)
   {
      Print("[StratoBot] Error creating ATR indicator handle");
      return(INIT_FAILED);
   }
   ArraySetAsSeries(m_atrBuffer, true);
   
   Print("[StratoBot] EA Initialized Successfully. Magic: ", InpMagicNumber);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(m_atrHandle != INVALID_HANDLE)
      IndicatorRelease(m_atrHandle);
   Print("[StratoBot] EA Deinitialized.");
}

//+------------------------------------------------------------------+
//| AST Verified CheckEntry Logic (AI INJECTED)                      |
//+------------------------------------------------------------------+
bool CheckEntryBuy()
{
   // [AI-GENERATED CHECK ENTRY BUY LOGIC]
   // Mandatory NormalizeDouble & CTrade compatibility enforced by AST
   double maFast = iMA(_Symbol, _Period, 9, 0, MODE_EMA, PRICE_CLOSE);
   double maSlow = iMA(_Symbol, _Period, 21, 0, MODE_EMA, PRICE_CLOSE);
   
   return (maFast > maSlow);
}

bool CheckEntrySell()
{
   // [AI-GENERATED CHECK ENTRY SELL LOGIC]
   double maFast = iMA(_Symbol, _Period, 9, 0, MODE_EMA, PRICE_CLOSE);
   double maSlow = iMA(_Symbol, _Period, 21, 0, MODE_EMA, PRICE_CLOSE);
   
   return (maFast < maSlow);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Safe calculation of Lot Size using NormalizeDouble
   double lotSize = CalculateLotSize(InpRiskPercent, InpStopLossPips);
   lotSize = NormalizeDouble(lotSize, 2);
   
   // Check open positions
   int totalPositions = PositionsTotal();
   bool hasOpenPosition = false;
   
   for(int i = totalPositions - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
      {
         hasOpenPosition = true;
         if(InpUseTrailing) ApplyTrailingStop(ticket, InpTrailingPips);
      }
   }
   
   if(!hasOpenPosition)
   {
      double ask = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_ASK), _Digits);
      double bid = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_BID), _Digits);
      
      if(CheckEntryBuy())
      {
         double sl = (InpStopLossPips > 0) ? NormalizeDouble(ask - InpStopLossPips * _Point * 10, _Digits) : 0;
         double tp = (InpTakeProfitPips > 0) ? NormalizeDouble(ask + InpTakeProfitPips * _Point * 10, _Digits) : 0;
         
         if(m_trade.Buy(lotSize, _Symbol, ask, sl, tp, "StratoBot AI Buy"))
            Print("[StratoBot] BUY Order Executed! Ticket: ", m_trade.ResultOrder());
      }
      else if(CheckEntrySell())
      {
         double sl = (InpStopLossPips > 0) ? NormalizeDouble(bid + InpStopLossPips * _Point * 10, _Digits) : 0;
         double tp = (InpTakeProfitPips > 0) ? NormalizeDouble(bid - InpTakeProfitPips * _Point * 10, _Digits) : 0;
         
         if(m_trade.Sell(lotSize, _Symbol, bid, sl, tp, "StratoBot AI Sell"))
            Print("[StratoBot] SELL Order Executed! Ticket: ", m_trade.ResultOrder());
      }
   }
}

//+------------------------------------------------------------------+
//| Lot Size & Helper Functions                                      |
//+------------------------------------------------------------------+
double CalculateLotSize(double riskPercent, int slPips)
{
   if(riskPercent <= 0 || slPips <= 0) return InpFixedLot;
   
   double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskAmount = accountBalance * (riskPercent / 100.0);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   
   if(tickValue == 0) return InpFixedLot;
   
   double calculatedLot = riskAmount / (slPips * 10 * tickValue);
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   
   if(calculatedLot < minLot) calculatedLot = minLot;
   if(calculatedLot > maxLot) calculatedLot = maxLot;
   
   return NormalizeDouble(calculatedLot, 2);
}

void ApplyTrailingStop(ulong ticket, int trailingPips)
{
   // Trailing Stop logic using safe CTrade modifications
   double ask = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_ASK), _Digits);
   double bid = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_BID), _Digits);
   
   if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY)
   {
      double currentSL = PositionGetDouble(POSITION_SL);
      double newSL = NormalizeDouble(bid - trailingPips * _Point * 10, _Digits);
      
      if(newSL > currentSL && bid - newSL >= trailingPips * _Point * 10)
      {
         m_trade.PositionModify(ticket, newSL, PositionGetDouble(POSITION_TP));
      }
   }
   else if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL)
   {
      double currentSL = PositionGetDouble(POSITION_SL);
      double newSL = NormalizeDouble(ask + trailingPips * _Point * 10, _Digits);
      
      if((currentSL == 0 || newSL < currentSL) && newSL - ask >= trailingPips * _Point * 10)
      {
         m_trade.PositionModify(ticket, newSL, PositionGetDouble(POSITION_TP));
      }
   }
}
`;

// Realistic 100 historical candles for backtesting simulation (EURUSD M15)
export const HISTORICAL_CANDLES: Candle[] = Array.from({ length: 100 }, (_, i) => {
  const basePrice = 1.0850;
  const time = new Date(Date.now() - (100 - i) * 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sineFactor = Math.sin(i / 6) * 0.0040;
  const trend = (i * 0.00008);
  const noise = (Math.sin(i * 3) * 0.0008);
  
  const open = parseFloat((basePrice + sineFactor + trend + noise).toFixed(5));
  const change = Math.sin(i * 1.7) * 0.0018 + (i % 7 === 0 ? 0.0022 : -0.0005);
  const close = parseFloat((open + change).toFixed(5));
  const high = parseFloat((Math.max(open, close) + Math.abs(Math.sin(i)) * 0.0012 + 0.0003).toFixed(5));
  const low = parseFloat((Math.min(open, close) - Math.abs(Math.cos(i)) * 0.0010 - 0.0002).toFixed(5));
  const volume = Math.floor(800 + Math.abs(Math.sin(i * 2)) * 3500);

  return { time, open, high, low, close, volume };
});
