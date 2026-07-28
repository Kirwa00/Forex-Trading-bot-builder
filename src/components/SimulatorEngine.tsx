import { useState, useMemo } from 'react';
import { Activity, Play, TrendingUp, TrendingDown, DollarSign, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';
import { StrategyBlueprint, Candle, BacktestSummary } from '../types';
import { HISTORICAL_CANDLES } from '../data/initialData';
import { runBacktestSimulation } from '../utils/backtestEngine';

interface SimulatorEngineProps {
  blueprint: StrategyBlueprint;
  currency: 'KES' | 'USD';
}

export const SimulatorEngine = ({ blueprint, currency }: SimulatorEngineProps) => {
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(100);
  const [customCandles] = useState<Candle[]>(HISTORICAL_CANDLES);

  // Run backtest over candles
  const { signals, summary } = useMemo(() => {
    return runBacktestSimulation(customCandles, blueprint);
  }, [customCandles, blueprint]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);

    const interval = setInterval(() => {
      setSimulationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  // Min and max price for SVG candlestick chart scaling
  const minPrice = Math.min(...customCandles.map((c) => c.low)) - 0.0010;
  const maxPrice = Math.max(...customCandles.map((c) => c.high)) + 0.0010;
  const priceRange = maxPrice - minPrice;

  const getYPos = (price: number) => {
    return 280 - ((price - minPrice) / priceRange) * 240;
  };

  return (
    <div className="space-y-6 py-4">
      {/* Banner & Control Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-full text-xs text-amber-300 font-mono mb-2">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Phase 3 Engine — 100 Candle Historical Backtester</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Strategy Backtest Chart & P&L Simulator
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Simulating <strong className="text-cyan-300">{blueprint.title}</strong> on {blueprint.symbol} ({blueprint.timeframe}). Buy/Sell signal arrows overlaid on price candles.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-orange-500/20 transition-all shrink-0"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running Backtest... ({simulationProgress}%)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run 100-Candle Backtest</span>
            </>
          )}
        </button>
      </div>

      {/* Backtest Progress Bar */}
      {isSimulating && (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-300">
            <span>Evaluating AST Logic over historical tick feed...</span>
            <span>{simulationProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-amber-400 h-full transition-all duration-200"
              style={{ width: `${simulationProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Performance Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        {/* Net PnL */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Net P&L Result</span>
          <div className="text-xl font-bold flex items-center space-x-1">
            {summary.netPnlUSD >= 0 ? (
              <span className="text-emerald-400">
                +{currency === 'KES' ? `KSh ${summary.netPnlKES.toLocaleString()}` : `$${summary.netPnlUSD}`}
              </span>
            ) : (
              <span className="text-rose-400">
                {currency === 'KES' ? `KSh ${summary.netPnlKES.toLocaleString()}` : `$${summary.netPnlUSD}`}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">Initial Equity: $1,000</span>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Win Rate %</span>
          <div className="text-xl font-bold text-cyan-400 flex items-center space-x-2">
            <span>{summary.winRate}%</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {summary.winningTrades} W / {summary.losingTrades} L ({summary.totalTrades} Trades)
          </span>
        </div>

        {/* Max Drawdown */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Max Drawdown</span>
          <div className="text-xl font-bold text-amber-400">
            <span>{summary.maxDrawdownPercent}%</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Risk Controlled</span>
        </div>

        {/* Profit Factor & Sharpe */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Profit Factor</span>
          <div className="text-xl font-bold text-indigo-400">
            <span>{summary.profitFactor}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Sharpe: {summary.sharpeRatio}</span>
        </div>
      </div>

      {/* Main Interactive SVG Candlestick Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white font-mono">
              {blueprint.symbol} {blueprint.timeframe} — Historical Candle Execution View
            </h2>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>BUY Signal</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>SELL Signal</span>
            </div>
          </div>
        </div>

        {/* Candlestick Chart Canvas */}
        <div className="relative w-full overflow-x-auto bg-slate-950 border border-slate-800/80 rounded-xl p-3">
          <svg className="w-full min-w-[700px] h-[300px]" viewBox="0 0 800 300">
            {/* Horizontal Grid lines */}
            {[0, 1, 2, 3, 4].map((g) => {
              const y = 20 + g * 60;
              const priceVal = (maxPrice - (g / 4) * priceRange).toFixed(4);
              return (
                <g key={g}>
                  <line x1="0" y1={y} x2="780" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="782" y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace">
                    {priceVal}
                  </text>
                </g>
              );
            })}

            {/* Candlesticks rendering */}
            {customCandles.map((candle, idx) => {
              const x = (idx / customCandles.length) * 760 + 10;
              const openY = getYPos(candle.open);
              const closeY = getYPos(candle.close);
              const highY = getYPos(candle.high);
              const lowY = getYPos(candle.low);

              const isBull = candle.close >= candle.open;
              const color = isBull ? '#10b981' : '#f43f5e';
              const topY = Math.min(openY, closeY);
              const height = Math.max(Math.abs(closeY - openY), 2);

              // Check if signal exists on this candle
              const signal = signals.find((s) => s.index === idx);

              return (
                <g key={idx} className="hover:opacity-80 transition-opacity">
                  {/* High/Low Wick line */}
                  <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1" />
                  {/* Body rectangle */}
                  <rect
                    x={x - 2.5}
                    y={topY}
                    width="5"
                    height={height}
                    fill={color}
                    rx="0.5"
                  />

                  {/* Signal Marker Overlays */}
                  {signal && (
                    <g>
                      {signal.type === 'BUY' ? (
                        /* Buy Green Arrow */
                        <g transform={`translate(${x - 6}, ${highY - 18})`}>
                          <polygon points="6,0 12,10 0,10" fill="#10b981" />
                          <circle cx="6" cy="5" r="8" fill="#10b981" fillOpacity="0.2" />
                        </g>
                      ) : (
                        /* Sell Red Arrow */
                        <g transform={`translate(${x - 6}, ${lowY + 8})`}>
                          <polygon points="6,10 12,0 0,0" fill="#f43f5e" />
                          <circle cx="6" cy="5" r="8" fill="#f43f5e" fillOpacity="0.2" />
                        </g>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Signals Execution Log Table */}
        <div className="space-y-3 pt-2 font-mono">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Executed Signal Log ({signals.length} Trades)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Entry Price</th>
                  <th className="p-2.5">Trigger Logic</th>
                  <th className="p-2.5">P&L Pips</th>
                  <th className="p-2.5">P&L Amount</th>
                  <th className="p-2.5">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {signals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500">
                      No trades triggered on current candle sample.
                    </td>
                  </tr>
                ) : (
                  signals.map((sig) => (
                    <tr key={sig.id} className="hover:bg-slate-950/40">
                      <td className="p-2.5 text-white font-semibold">{sig.time}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sig.type === 'BUY'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {sig.type}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-cyan-300">{sig.price.toFixed(5)}</td>
                      <td className="p-2.5 text-slate-300 truncate max-w-[200px]">{sig.reason}</td>
                      <td className="p-2.5 font-bold">
                        {sig.pnlPips && sig.pnlPips > 0 ? (
                          <span className="text-emerald-400">+{sig.pnlPips} pips</span>
                        ) : (
                          <span className="text-rose-400">{sig.pnlPips} pips</span>
                        )}
                      </td>
                      <td className="p-2.5 font-bold">
                        {sig.pnlAmountUSD && sig.pnlAmountUSD > 0 ? (
                          <span className="text-emerald-400">
                            +{currency === 'KES' ? `KSh ${sig.pnlAmountKES?.toLocaleString()}` : `$${sig.pnlAmountUSD}`}
                          </span>
                        ) : (
                          <span className="text-rose-400">
                            {currency === 'KES' ? `KSh ${sig.pnlAmountKES?.toLocaleString()}` : `$${sig.pnlAmountUSD}`}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {sig.win ? (
                          <span className="text-emerald-400 font-bold flex items-center space-x-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>WIN (TP)</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center space-x-1">
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>LOSS (SL)</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
