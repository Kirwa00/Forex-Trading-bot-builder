import { useState } from 'react';
import { Award, Server, Activity, Plus, PlayCircle, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { VideoCard, StrategyBlueprint } from '../types';
import { INITIAL_VIDEOS } from '../data/initialData';

export const AdminPanel = () => {
  const [videoList, setVideoList] = useState<VideoCard[]>(INITIAL_VIDEOS);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCreator, setNewCreator] = useState<string>('');
  const [newConcept, setNewConcept] = useState<string>('');

  const handleAddVideo = () => {
    if (!newTitle.trim()) return;

    const dummyBp: StrategyBlueprint = {
      id: `bp-custom-${Date.now()}`,
      title: newTitle,
      description: `Custom curated strategy video: ${newConcept}`,
      symbol: 'EURUSD',
      timeframe: 'M15',
      riskPercent: 1.0,
      fixedLot: 0.1,
      stopLossPips: 20,
      takeProfitPips: 60,
      useTrailingStop: true,
      trailingStopPips: 15,
      magicNumber: 708801,
      bricks: [
        { instanceId: 'b-custom-1', brickId: 'killzone', config: { session: 'London' } },
        { instanceId: 'b-custom-2', brickId: 'fvg', config: { minGapPips: 3 } }
      ],
      checkEntryLogic: 'CheckKillzone() && CheckFVG()',
      checkExitLogic: 'ApplyTrailingStop()'
    };

    const newVid: VideoCard = {
      id: `vid-${Date.now()}`,
      title: newTitle,
      creator: newCreator || 'Nairobi Forex Quant',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '1:30',
      badge: 'Custom Strategy',
      concept: newConcept || 'SMC FVG Sweep',
      winRateEst: '75% - 82%',
      blueprint: dummyBp
    };

    setVideoList([newVid, ...videoList]);
    setNewTitle('');
    setNewCreator('');
    setNewConcept('');
  };

  return (
    <div className="space-y-6 py-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-rose-950/80 border border-rose-800 px-3 py-1 rounded-full text-xs text-rose-300 font-mono mb-2">
            <Award className="w-3.5 h-3.5 text-rose-400" />
            <span>Admin Curation & Telemetry Dashboard (Phase 5/6)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            StratoBot System Administration
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Curate video strategy blueprints for the Research Hub and monitor Azure Windows Spot VM compilation agent metrics.
          </p>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        {/* Azure VM CPU */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1.5 font-bold text-white">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Azure VM CPU</span>
            </span>
            <span className="text-emerald-400 font-bold">14.2%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-cyan-500 h-full w-[14%]" />
          </div>
          <span className="text-[10px] text-slate-500 block">B2s (2 vCPU, 4GB RAM)</span>
        </div>

        {/* Redis Queue Status */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1.5 font-bold text-white">
              <Server className="w-4 h-4 text-purple-400" />
              <span>Redis BullMQ Queue</span>
            </span>
            <span className="text-purple-400 font-bold">0 Pending</span>
          </div>
          <div className="text-slate-300 font-bold">1,420 Jobs Completed</div>
          <span className="text-[10px] text-slate-500 block">Avg Latency: 4,820 ms</span>
        </div>

        {/* Compile Success Rate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1.5 font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AST Success Rate</span>
            </span>
            <span className="text-emerald-400 font-bold">96.8%</span>
          </div>
          <div className="text-slate-300 font-bold">AST Repair Target &gt;92%</div>
          <span className="text-[10px] text-slate-500 block">Phase 1 Gate Passed</span>
        </div>

        {/* Rate Limit Spend */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1.5 font-bold text-white">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Rate Limit Health</span>
            </span>
            <span className="text-amber-400 font-bold">Active</span>
          </div>
          <div className="text-slate-300 font-bold">5 Gens/hr (Free)</div>
          <span className="text-[10px] text-slate-500 block">Unlimited for Pro Tier</span>
        </div>
      </div>

      {/* Video Hub Strategy Curation CMS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2 font-mono">
          <PlayCircle className="w-4 h-4 text-emerald-400" />
          <span>Video Research Hub Curation CMS (Phase 2 Requirement)</span>
        </h2>

        {/* Form to Add Video */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
          <span className="text-slate-400 font-bold uppercase block text-[10px]">
            Upload & Map YouTube Short / Tutorial to Pre-filled Blueprint
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Video Title (e.g., ICT Asian Range Sweep)"
              className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={newCreator}
              onChange={(e) => setNewCreator(e.target.value)}
              placeholder="Creator Name"
              className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={newConcept}
              onChange={(e) => setNewConcept(e.target.value)}
              placeholder="Concept / Strategy Tags"
              className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleAddVideo}
            disabled={!newTitle.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Video Card & Map Blueprint JSON</span>
          </button>
        </div>

        {/* Existing Curated Videos Table */}
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-3">Title</th>
                <th className="p-3">Creator</th>
                <th className="p-3">Concept</th>
                <th className="p-3">Mapped Blueprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {videoList.map((v) => (
                <tr key={v.id}>
                  <td className="p-3 text-white font-semibold">{v.title}</td>
                  <td className="p-3 text-slate-400">{v.creator}</td>
                  <td className="p-3 text-cyan-400">{v.concept}</td>
                  <td className="p-3 text-emerald-400 font-bold">{v.blueprint.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
