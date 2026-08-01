export type SdlcPhaseId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface SdlcPhase {
  id: SdlcPhaseId;
  name: string;
  weeks: string;
  goal: string;
  status: 'completed' | 'in_progress' | 'planned';
  deliverables: string[];
  gatingCriteria: {
    criterion: string;
    passed: boolean;
  }[];
}

export type BrickCategory = 'entry' | 'exit' | 'filter' | 'risk' | 'pattern';

export interface LegoBrick {
  id: string;
  name: string;
  codeName: string;
  category: BrickCategory;
  description: string;
  iconName: string;
  defaultConfig: Record<string, number | string | boolean>;
}

export interface SelectedBrick {
  instanceId: string;
  brickId: string;
  config: Record<string, number | string | boolean>;
}

export interface StrategyBlueprint {
  id: string;
  title: string;
  description: string;
  symbol: string;
  timeframe: string;
  riskPercent: number;
  fixedLot: number;
  stopLossPips: number;
  takeProfitPips: number;
  useTrailingStop: boolean;
  trailingStopPips: number;
  magicNumber: number;
  bricks: SelectedBrick[];
  checkEntryLogic: string;
  checkExitLogic: string;
}

export interface AstValidationResult {
  isValid: boolean;
  errors: {
    line?: number;
    code: string;
    message: string;
    severity: 'error' | 'warning';
  }[];
  passedRules: string[];
}

/**
 * Result of validating generated MQL5 before download. Reports only what the
 * server actually did — parse and check the source. Compiling to .ex5 requires
 * MetaEditor on Windows, which happens in the user's own MetaTrader install.
 */
export interface StrategyCheck {
  checkedAt: string;
  durationMs: number;
  passed: boolean;
  errorCount: number;
  warningCount: number;
  lineCount: number;
  byteSize: number;
  checks: string[];
  problems: {
    severity: 'error' | 'warning';
    line?: number;
    message: string;
  }[];
}

export interface VideoCard {
  id: string;
  title: string;
  creator: string;
  thumbnailUrl: string;
  embedUrl: string;
  duration: string;
  badge: string;
  concept: string;
  winRateEst: string;
  blueprint: StrategyBlueprint;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeSignal {
  id: string;
  index: number;
  time: string;
  type: 'BUY' | 'SELL';
  price: number;
  exitIndex?: number;
  exitTime?: string;
  exitPrice?: number;
  pnlPips?: number;
  pnlAmountUSD?: number;
  pnlAmountKES?: number;
  reason: string;
  win: boolean;
}

export interface BacktestSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnlUSD: number;
  netPnlKES: number;
  maxDrawdownPercent: number;
  profitFactor: number;
  sharpeRatio: number;
  equityCurve: { candleIndex: number; equityUSD: number; equityKES: number }[];
}

export interface UserSubscription {
  tier: 'Free' | 'Pro';
  downloadsUsedThisHour: number;
  hourlyLimit: number;
  expiresAt?: string;
  kesPrice: number;
  usdPrice: number;
}

export interface PaymentTransaction {
  merchantReference: string;
  pesapalTrackingId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: 'KES' | 'USD';
  phoneNumber?: string;
  email?: string;
  createdAt: string;
  confirmationCode?: string;
  paymentMethod?: string;
}
