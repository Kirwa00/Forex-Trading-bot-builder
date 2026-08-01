import { useState } from 'react';
import { Layers, Plus, Trash2, Sliders, Zap, Code, Activity, Sparkles, Check, ArrowRight, Shield } from 'lucide-react';
import { LegoBrick, StrategyBlueprint, SelectedBrick } from '../types';
import { INITIAL_LEGO_BRICKS } from '../data/initialData';

interface LegoBuilderProps {
  blueprint: StrategyBlueprint;
  setBlueprint: (bp: StrategyBlueprint) => void;
  onSendToBacktest: () => void;
  onSendToCompile: () => void;
  /** 'describe' is step 1 (the prompt); 'tune' is step 2 (the rules canvas). */
  view: 'describe' | 'tune';
  onGenerated: () => void;
}

/** One-click starters, so a first-time user never faces an empty box. */
const EXAMPLE_PROMPTS = [
  {
    label: 'London session, gap entry',
    text: 'Only trade during the London session on EURUSD M15. Enter when price returns to a fair value gap inside an order block. Risk 1% per trade with a 15 pip stop and a 45 pip target, using a trailing stop.',
  },
  {
    label: 'Trend following on gold',
    text: 'Buy XAUUSD on the 1 hour chart when the 9 EMA crosses above the 21 EMA, but only if the ATR shows the market is actually moving. Stop loss 30 pips, take profit 90 pips.',
  },
  {
    label: 'Liquidity sweep reversal',
    text: 'On GBPUSD M15, wait for price to sweep the previous day high or low and reject immediately with an engulfing candle. Enter the reversal with a 20 pip stop and a 60 pip target.',
  },
];

export const LegoBuilder = ({
  blueprint,
  setBlueprint,
  onSendToBacktest,
  onSendToCompile,
  view,
  onGenerated,
}: LegoBuilderProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [promptInput, setPromptInput] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'json'>('canvas');

  // Filter available bricks by category
  const filteredBricks = INITIAL_LEGO_BRICKS.filter(
    (b) => selectedCategory === 'all' || b.category === selectedCategory
  );

  // Add brick to strategy canvas
  const handleAddBrick = (brick: LegoBrick) => {
    const newSelected: SelectedBrick = {
      instanceId: `inst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      brickId: brick.id,
      config: { ...brick.defaultConfig },
    };

    const updatedBricks = [...blueprint.bricks, newSelected];
    setBlueprint({
      ...blueprint,
      bricks: updatedBricks,
      checkEntryLogic: updatedBricks.map((b) => b.brickId).join(' && '),
    });
  };

  // Remove brick from canvas
  const handleRemoveBrick = (instanceId: string) => {
    const updatedBricks = blueprint.bricks.filter((b) => b.instanceId !== instanceId);
    setBlueprint({
      ...blueprint,
      bricks: updatedBricks,
      checkEntryLogic: updatedBricks.map((b) => b.brickId).join(' && ') || 'iMA() > iMA()',
    });
  };

  // Update config of an active brick
  const handleUpdateConfig = (instanceId: string, key: string, value: any) => {
    const updatedBricks = blueprint.bricks.map((b) => {
      if (b.instanceId === instanceId) {
        return {
          ...b,
          config: { ...b.config, [key]: value },
        };
      }
      return b;
    });
    setBlueprint({ ...blueprint, bricks: updatedBricks });
  };

  // Generate blueprint via Gemini AI server route
  const handleAiGenerate = async (override?: string) => {
    const prompt = (override ?? promptInput).trim();
    if (!prompt) return;
    setIsGeneratingAi(true);
    setGenerateError(null);

    try {
      const res = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentSymbol: blueprint.symbol,
          currentTimeframe: blueprint.timeframe,
        }),
      });

      const data = await res.json();
      if (data.blueprint) {
        setBlueprint(data.blueprint);
        setPromptInput('');
        onGenerated();
      } else {
        setGenerateError(data.error || 'Could not build that strategy. Try describing it differently.');
      }
    } catch (err) {
      console.error('Failed to generate blueprint via Gemini AI:', err);
      setGenerateError('Could not reach the server. Check your connection and try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (view === 'describe') {
    return (
      <div className="py-4 sm:py-10 max-w-3xl mx-auto space-y-8">
        {/* What this thing actually does */}
        <div className="space-y-3 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-balance">
            Describe a trading strategy. Get back a robot for MetaTrader 5.
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Write your rules the way you'd explain them to another trader. We turn them into an
            Expert Advisor file you install in MT5 — no coding. You'll need the MetaTrader 5
            terminal to run it.
          </p>
        </div>

        {/* Prompt */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <label htmlFor="strategy-prompt" className="text-xs font-bold text-slate-200 block">
            Your strategy
          </label>

          <textarea
            id="strategy-prompt"
            rows={4}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Example: Only trade EURUSD during the London session on the 15 minute chart. Buy when price pulls back into a gap left by a strong move up. Risk 1% per trade, 15 pip stop loss, 45 pip target, and trail the stop once I'm 20 pips in profit."
            className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 leading-relaxed resize-y"
          />

          {generateError && (
            <p className="text-xs text-red-300 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
              {generateError}
            </p>
          )}

          <button
            onClick={() => handleAiGenerate()}
            disabled={isGeneratingAi || !promptInput.trim()}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
          >
            {isGeneratingAi ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Building your strategy…</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Build my strategy</span>
              </>
            )}
          </button>
        </div>

        {/* Starters */}
        <div className="space-y-3">
          <p className="text-xs text-slate-400 text-center">Or start from one of these:</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example.label}
                onClick={() => handleAiGenerate(example.text)}
                disabled={isGeneratingAi}
                className="text-left bg-slate-900 border border-slate-800 hover:border-cyan-500/50 disabled:opacity-40 rounded-xl p-3.5 transition-colors group"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {example.label}
                </span>
                <span className="text-[11px] text-slate-500 line-clamp-2 mt-1 block leading-relaxed">
                  {example.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-slate-600 text-center">
          Building and testing are free. You only pay when you download the file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Brick Library (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Add a rule</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              10 available
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
            {['all', 'entry', 'filter', 'pattern', 'risk'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Bricks Palette List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredBricks.map((brick) => (
              <div
                key={brick.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 p-3 rounded-xl transition-all group flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors truncate">
                      {brick.name}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      {brick.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {brick.description}
                  </p>
                </div>

                <button
                  onClick={() => handleAddBrick(brick)}
                  className="bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white p-2 rounded-lg transition-all shrink-0 mt-0.5"
                  title="Add brick to strategy canvas"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Strategy Canvas & Parameters (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Strategy Meta Header & Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <input
                  type="text"
                  value={blueprint.title}
                  onChange={(e) => setBlueprint({ ...blueprint, title: e.target.value })}
                  className="bg-transparent border-b border-slate-700 text-lg font-bold text-white focus:outline-none focus:border-cyan-400 w-full"
                />
                <p className="text-xs text-slate-400 mt-1">{blueprint.description}</p>
              </div>

              {/* View Toggle (Canvas vs JSON) */}
              <div className="bg-slate-950 border border-slate-800 p-0.5 rounded-lg flex text-xs font-mono shrink-0">
                <button
                  onClick={() => setActiveTab('canvas')}
                  className={`px-3 py-1.5 rounded-md ${
                    activeTab === 'canvas' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rules
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 rounded-md ${
                    activeTab === 'json' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw data
                </button>
              </div>
            </div>

            {/* Quick Strategy Settings Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Symbol</label>
                <select
                  value={blueprint.symbol}
                  onChange={(e) => setBlueprint({ ...blueprint, symbol: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 w-full text-xs"
                >
                  <option value="EURUSD">EURUSD</option>
                  <option value="GBPUSD">GBPUSD</option>
                  <option value="XAUUSD">XAUUSD (Gold)</option>
                  <option value="USDJPY">USDJPY</option>
                </select>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Timeframe</label>
                <select
                  value={blueprint.timeframe}
                  onChange={(e) => setBlueprint({ ...blueprint, timeframe: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 w-full text-xs"
                >
                  <option value="M5">M5 (5 Minutes)</option>
                  <option value="M15">M15 (15 Minutes)</option>
                  <option value="H1">H1 (1 Hour)</option>
                </select>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Stop Loss (Pips)</label>
                <input
                  type="number"
                  value={blueprint.stopLossPips}
                  onChange={(e) => setBlueprint({ ...blueprint, stopLossPips: parseInt(e.target.value) || 10 })}
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 w-full text-xs"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Take Profit (Pips)</label>
                <input
                  type="number"
                  value={blueprint.takeProfitPips}
                  onChange={(e) => setBlueprint({ ...blueprint, takeProfitPips: parseInt(e.target.value) || 30 })}
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 w-full text-xs"
                />
              </div>
            </div>
          </div>

          {/* Active Canvas / Blocks List */}
          {activeTab === 'canvas' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Active Strategy Composition ({blueprint.bricks.length} Bricks)
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Risk: <span className="text-cyan-400 font-bold">{blueprint.riskPercent}%</span> per trade
                </span>
              </div>

              {blueprint.bricks.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
                  <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    No bricks added yet. Tap <strong className="text-cyan-400">+</strong> on any brick from the library or use AI prompt.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blueprint.bricks.map((sb, idx) => {
                    const brickDef = INITIAL_LEGO_BRICKS.find((b) => b.id === sb.brickId);
                    return (
                      <div
                        key={sb.instanceId}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 relative group hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-sm text-white">{brickDef?.name || sb.brickId}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono uppercase">
                              {brickDef?.category}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemoveBrick(sb.instanceId)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                            title="Remove brick"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Config sliders & inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-slate-900">
                          {Object.entries(sb.config).map(([cfgKey, cfgVal]) => (
                            <div key={cfgKey} className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                              <span className="text-slate-400 text-[11px] capitalize">{cfgKey.replace(/([A-Z])/g, ' $1')}</span>
                              {typeof cfgVal === 'number' ? (
                                <input
                                  type="number"
                                  value={cfgVal}
                                  onChange={(e) =>
                                    handleUpdateConfig(sb.instanceId, cfgKey, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-20 bg-slate-950 border border-slate-700 text-right text-white rounded px-2 py-0.5 text-xs"
                                />
                              ) : typeof cfgVal === 'boolean' ? (
                                <button
                                  onClick={() => handleUpdateConfig(sb.instanceId, cfgKey, !cfgVal)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    cfgVal ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {cfgVal ? 'ENABLED' : 'DISABLED'}
                                </button>
                              ) : (
                                <input
                                  type="text"
                                  value={String(cfgVal)}
                                  onChange={(e) => handleUpdateConfig(sb.instanceId, cfgKey, e.target.value)}
                                  className="w-28 bg-slate-950 border border-slate-700 text-right text-white rounded px-2 py-0.5 text-xs truncate"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Where to go next */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={onSendToCompile}
                  className="w-full sm:w-auto order-2 sm:order-1 text-xs text-slate-400 hover:text-white px-3 py-2.5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Skip to the file</span>
                </button>

                <button
                  onClick={onSendToBacktest}
                  className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/20 transition-all"
                >
                  <Activity className="w-4 h-4" />
                  <span>Test it on past prices</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* JSON Blueprint Inspector */
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono text-xs text-cyan-300 overflow-x-auto space-y-3">
              <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                <span>pre_filled_blueprint.json</span>
                <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Valid Strategy Structure</span>
                </span>
              </div>
              <pre className="p-3 bg-slate-900 rounded-xl leading-relaxed text-[11px] text-slate-300">
                {JSON.stringify(blueprint, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
