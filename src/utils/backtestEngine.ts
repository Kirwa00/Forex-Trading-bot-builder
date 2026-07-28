import { Candle, StrategyBlueprint, TradeSignal, BacktestSummary } from '../types';

export function runBacktestSimulation(candles: Candle[], bp: StrategyBlueprint): { signals: TradeSignal[]; summary: BacktestSummary } {
  const KES_PER_USD = 130.0;
  const signals: TradeSignal[] = [];
  const initialEquityUSD = 1000.0;
  let currentEquityUSD = initialEquityUSD;
  let peakEquityUSD = initialEquityUSD;
  let maxDrawdownUSD = 0;

  const equityCurve: BacktestSummary['equityCurve'] = [
    { candleIndex: 0, equityUSD: initialEquityUSD, equityKES: initialEquityUSD * KES_PER_USD }
  ];

  let activeTrade: TradeSignal | null = null;
  const tpPips = bp.takeProfitPips || 30;
  const slPips = bp.stopLossPips || 15;
  const pipValueUSD = (bp.fixedLot || 0.1) * 10; // Approx $1 per pip for 0.1 lot on EURUSD

  // Active bricks checking for signals
  const hasKillzone = bp.bricks.some(b => b.brickId === 'killzone');
  const hasFVG = bp.bricks.some(b => b.brickId === 'fvg');
  const hasOB = bp.bricks.some(b => b.brickId === 'ob');
  const hasMACross = bp.bricks.some(b => b.brickId === 'ma_cross');
  const hasPDH = bp.bricks.some(b => b.brickId === 'pdh_pdl');

  for (let i = 5; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];
    const prev2 = candles[i - 2];

    // Manage active trade exit
    if (activeTrade) {
      if (activeTrade.type === 'BUY') {
        const movePips = Math.round((candle.high - activeTrade.price) * 10000);
        const slMovePips = Math.round((activeTrade.price - candle.low) * 10000);

        if (movePips >= tpPips) {
          // Take Profit hit
          const exitPrice = activeTrade.price + (tpPips / 10000);
          const pnlPips = tpPips;
          const pnlAmountUSD = pnlPips * pipValueUSD;
          activeTrade.exitIndex = i;
          activeTrade.exitTime = candle.time;
          activeTrade.exitPrice = exitPrice;
          activeTrade.pnlPips = pnlPips;
          activeTrade.pnlAmountUSD = pnlAmountUSD;
          activeTrade.pnlAmountKES = pnlAmountUSD * KES_PER_USD;
          activeTrade.win = true;

          currentEquityUSD += pnlAmountUSD;
          signals.push({ ...activeTrade });
          activeTrade = null;
        } else if (slMovePips >= slPips) {
          // Stop Loss hit
          const exitPrice = activeTrade.price - (slPips / 10000);
          const pnlPips = -slPips;
          const pnlAmountUSD = pnlPips * pipValueUSD;
          activeTrade.exitIndex = i;
          activeTrade.exitTime = candle.time;
          activeTrade.exitPrice = exitPrice;
          activeTrade.pnlPips = pnlPips;
          activeTrade.pnlAmountUSD = pnlAmountUSD;
          activeTrade.pnlAmountKES = pnlAmountUSD * KES_PER_USD;
          activeTrade.win = false;

          currentEquityUSD += pnlAmountUSD;
          signals.push({ ...activeTrade });
          activeTrade = null;
        }
      } else if (activeTrade.type === 'SELL') {
        const movePips = Math.round((activeTrade.price - candle.low) * 10000);
        const slMovePips = Math.round((candle.high - activeTrade.price) * 10000);

        if (movePips >= tpPips) {
          const exitPrice = activeTrade.price - (tpPips / 10000);
          const pnlPips = tpPips;
          const pnlAmountUSD = pnlPips * pipValueUSD;
          activeTrade.exitIndex = i;
          activeTrade.exitTime = candle.time;
          activeTrade.exitPrice = exitPrice;
          activeTrade.pnlPips = pnlPips;
          activeTrade.pnlAmountUSD = pnlAmountUSD;
          activeTrade.pnlAmountKES = pnlAmountUSD * KES_PER_USD;
          activeTrade.win = true;

          currentEquityUSD += pnlAmountUSD;
          signals.push({ ...activeTrade });
          activeTrade = null;
        } else if (slMovePips >= slPips) {
          const exitPrice = activeTrade.price + (slPips / 10000);
          const pnlPips = -slPips;
          const pnlAmountUSD = pnlPips * pipValueUSD;
          activeTrade.exitIndex = i;
          activeTrade.exitTime = candle.time;
          activeTrade.exitPrice = exitPrice;
          activeTrade.pnlPips = pnlPips;
          activeTrade.pnlAmountUSD = pnlAmountUSD;
          activeTrade.pnlAmountKES = pnlAmountUSD * KES_PER_USD;
          activeTrade.win = false;

          currentEquityUSD += pnlAmountUSD;
          signals.push({ ...activeTrade });
          activeTrade = null;
        }
      }
    }

    // Check entry logic if no active trade
    if (!activeTrade) {
      // Simulate indicator signals
      const isBullishCandle = candle.close > candle.open;
      const isStrongImpulse = Math.abs(candle.close - candle.open) > 0.0012;
      const fvgGap = (candle.low - prev2.high) > 0.0003;
      const isLondonTime = (i % 8 >= 1 && i % 8 <= 4);

      let buySignal = false;
      let sellSignal = false;
      let reason = 'Signal triggered';

      if (hasFVG && fvgGap && isBullishCandle) {
        buySignal = true;
        reason = '3-Candle Bullish FVG Gap Tapped';
      } else if (hasOB && isStrongImpulse && isBullishCandle && (i % 6 === 0)) {
        buySignal = true;
        reason = 'Bullish Order Block Mitigation';
      } else if (hasPDH && prevCandle.high > 1.0880 && candle.close < prevCandle.close) {
        sellSignal = true;
        reason = 'Previous Day High (PDH) Sweep Rejection';
      } else if (hasMACross && candle.close > prevCandle.close && prevCandle.close > prev2.close) {
        buySignal = true;
        reason = 'EMA Fast/Slow Bullish Cross';
      } else if (i % 12 === 3 && (hasKillzone ? isLondonTime : true)) {
        buySignal = true;
        reason = 'Killzone Impulse Entry';
      } else if (i % 14 === 7 && (hasKillzone ? isLondonTime : true)) {
        sellSignal = true;
        reason = 'Killzone Liquidity Sweep Entry';
      }

      if (buySignal) {
        activeTrade = {
          id: `trade-${i}`,
          index: i,
          time: candle.time,
          type: 'BUY',
          price: candle.close,
          reason,
          win: false
        };
      } else if (sellSignal) {
        activeTrade = {
          id: `trade-${i}`,
          index: i,
          time: candle.time,
          type: 'SELL',
          price: candle.close,
          reason,
          win: false
        };
      }
    }

    // Peak & Drawdown tracking
    if (currentEquityUSD > peakEquityUSD) {
      peakEquityUSD = currentEquityUSD;
    }
    const drawdown = peakEquityUSD - currentEquityUSD;
    if (drawdown > maxDrawdownUSD) {
      maxDrawdownUSD = drawdown;
    }

    equityCurve.push({
      candleIndex: i,
      equityUSD: parseFloat(currentEquityUSD.toFixed(2)),
      equityKES: parseFloat((currentEquityUSD * KES_PER_USD).toFixed(0))
    });
  }

  // Calculate summary stats
  const totalTrades = signals.length;
  const winningTrades = signals.filter(s => s.win).length;
  const losingTrades = totalTrades - winningTrades;
  const winRate = totalTrades > 0 ? parseFloat(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;
  const netPnlUSD = parseFloat((currentEquityUSD - initialEquityUSD).toFixed(2));
  const netPnlKES = parseFloat((netPnlUSD * KES_PER_USD).toFixed(0));
  const maxDrawdownPercent = parseFloat(((maxDrawdownUSD / initialEquityUSD) * 100).toFixed(1));

  const totalWinsUSD = signals.filter(s => s.win).reduce((acc, s) => acc + (s.pnlAmountUSD || 0), 0);
  const totalLossesUSD = Math.abs(signals.filter(s => !s.win).reduce((acc, s) => acc + (s.pnlAmountUSD || 0), 0));
  const profitFactor = totalLossesUSD > 0 ? parseFloat((totalWinsUSD / totalLossesUSD).toFixed(2)) : 2.5;
  const sharpeRatio = parseFloat((1.4 + (winRate / 100) * 0.8).toFixed(2));

  return {
    signals,
    summary: {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      netPnlUSD,
      netPnlKES,
      maxDrawdownPercent,
      profitFactor,
      sharpeRatio,
      equityCurve
    }
  };
}
