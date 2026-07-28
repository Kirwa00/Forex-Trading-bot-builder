import { useState } from 'react';
import { Layers, Plus, Trash2, Sliders, Zap, Code, Activity, Sparkles, Check, ArrowRight, Shield } from 'lucide-react';
import { LegoBrick, StrategyBlueprint, SelectedBrick } from '../types';
import { INITIAL_LEGO_BRICKS } from '../data/initialData';

interface LegoBuilderProps {
  blueprint: StrategyBlueprint;
  setBlueprint: (bp: StrategyBlueprint) => void;
  onSendToBacktest: () => void;
  onSendToCompile: () => void;
}

export const LegoBuilder = ({
  blueprint,
  setBlueprint,
  onSendToBacktest,
  onSendToCompile,
}: LegoBuilderProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [promptInput, setPromptInput] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
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
  const handleAiGenerate = async () => {
    if (!promptInput.trim()) return;
    setIsGeneratingAi(true);

    try {
      const res = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptInput,
          currentSymbol: blueprint.symbol,
          currentTimeframe: blueprint.timeframe,
        }),
      });

      const data = await res.json();
      if (data.blueprint) {
        setBlueprint(data.blueprint);
        setPromptInput('');
      }
    } catch (err) {
      console.error('Failed to generate blueprint via Gemini AI:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* AI Strategy Prompt Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm mb-2 font-mono">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>AI Strategy Generator — Server-Side Gemini API</span>
        </div>
        <p className="text-xs text-slate-300 mb-3">
          Describe your MT5 trading strategy in natural language (e.g., <em className="text-cyan-200">"Build a London Killzone FVG strategy for EURUSD M15 with trailing stop"</em>).
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            placeholder="Type strategy prompt (e.g. Silver Bullet 10am sweep, 1:3 RR with trailing stop)..."
            className="flex-1 bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-cyan-500 font-mono placeholder:text-slate-500"
          />
          <button
            onClick={handleAiGenerate}
            disabled={isGeneratingAi || !promptInput.trim()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/20 transition-all"
          >
            {isGeneratingAi ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>AI Generating...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Generate Blueprint</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Brick Library (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>10 Core Lego Bricks</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              Phase 2 Spec
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
                  Visual Canvas
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 rounded-md ${
                    activeTab === 'json' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Blueprint JSON
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

              {/* Action Buttons: Run Backtest vs Compile MQL5 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={onSendToBacktest}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all"
                >
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Run 100-Candle Backtest</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onSendToCompile}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/20 transition-all"
                >
                  <Code className="w-4 h-4" />
                  <span>Compile to MQL5 & EX5</span>
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
