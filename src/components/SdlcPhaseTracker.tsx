import React from 'react';
import { CheckCircle2, Clock, ShieldAlert, Cpu, Check, Terminal, FileCode2, Server, Key } from 'lucide-react';
import { SDLC_PHASES } from '../data/initialData';

export const SdlcPhaseTracker: React.FC = () => {
  return (
    <div className="space-y-8 py-6">
      {/* Banner / Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-cyan-950/80 border border-cyan-800 px-3 py-1 rounded-full text-xs text-cyan-300 font-mono mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Phased-Milestone SDLC Framework (20-Week Target)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              StratoBot AI — Software Development Lifecycle (SDLC)
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              De-risking the MT5 MetaEditor Windows compilation environment on Day 1. Strictly gating AI code output through AST safety parsing before passing to compiler agents.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-xs font-mono space-y-1.5 min-w-[240px]">
            <div className="flex justify-between text-slate-400">
              <span>Overall Progress:</span>
              <span className="text-emerald-400 font-bold">Phase 4 / 6 Active</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[70%]" />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Weeks 1-16 Complete</span>
              <span>Go-Live: Week 20</span>
            </div>
          </div>
        </div>
      </div>

      {/* SDLC Principles & Mandates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
            <Server className="w-4 h-4" />
            <span>Core Principle: Master Wrapper</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            AI is treated as a "Junior Dev" filling only specific functions (<code className="bg-slate-800 px-1 rounded text-cyan-300">CheckEntry</code>, <code className="bg-slate-800 px-1 rounded text-cyan-300">CheckExit</code>) inside a human-written static Master Wrapper C++ class.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>AST Code Safety Gate</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Rejects legacy MQL4 code (<code className="bg-slate-800 px-1 rounded text-amber-300">OrderSend</code>), enforces <code className="bg-slate-800 px-1 rounded text-amber-300">NormalizeDouble</code>, and automatically triggers auto-repair prompts on compiler failure.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <Key className="w-4 h-4" />
            <span>Windows Spot VM Agent</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Azure Windows Server VM with MetaEditor 5 CLI (<code className="bg-slate-800 px-1 rounded text-emerald-300">metaeditor64.exe /compile</code>) integrated via Redis BullMQ queue (&lt;12s compile target).
          </p>
        </div>
      </div>

      {/* SDLC Timeline & Phases */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <FileCode2 className="w-5 h-5 text-cyan-400" />
          <span>SDLC Phase Roadmap & Gating Criteria</span>
        </h2>

        <div className="space-y-4">
          {SDLC_PHASES.map((phase) => (
            <div
              key={phase.id}
              className={`border rounded-xl p-5 transition-all ${
                phase.status === 'completed'
                  ? 'bg-slate-900/80 border-emerald-500/30 shadow-md'
                  : phase.status === 'in_progress'
                  ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/40 border-slate-800 opacity-80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm font-mono ${
                      phase.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : phase.status === 'in_progress'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    P{phase.id}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <span>{phase.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400">{phase.goal}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono">
                  <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                    {phase.weeks}
                  </span>

                  {phase.status === 'completed' && (
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-md flex items-center space-x-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}
                  {phase.status === 'in_progress' && (
                    <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded-md flex items-center space-x-1 font-semibold animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      <span>In Progress</span>
                    </span>
                  )}
                  {phase.status === 'planned' && (
                    <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-md">
                      Planned
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Deliverables */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Key Deliverables
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {phase.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gating Criteria */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Gating Criteria Checklist
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {phase.gatingCriteria.map((gate, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg border ${
                          gate.passed
                            ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="truncate pr-2">{gate.criterion}</span>
                        {gate.passed ? (
                          <span className="flex items-center space-x-1 text-emerald-400 font-bold text-[11px] shrink-0 font-mono">
                            <Check className="w-3.5 h-3.5" />
                            <span>PASSED</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px] shrink-0">PENDING</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SDLC Risk Register */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>SDLC Specific Risk Register</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-3">Risk Event</th>
                <th className="p-3">Phase</th>
                <th className="p-3">Mitigation Strategy</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-3 text-white font-semibold">Claude/Gemini changes MQL5 output format</td>
                <td className="p-3 text-cyan-400">Phase 1</td>
                <td className="p-3">AST Parser rejects invalid output and triggers automatic "Fix this specific error" re-prompt loop.</td>
                <td className="p-3"><span className="text-emerald-400">Mitigated</span></td>
              </tr>
              <tr>
                <td className="p-3 text-white font-semibold">M-Pesa / PesaPal webhooks dropped during outage</td>
                <td className="p-3 text-cyan-400">Phase 4</td>
                <td className="p-3">Daily cron job reconciles Supabase/Postgres subscriptions against PesaPal transactions at 2 AM EAT.</td>
                <td className="p-3"><span className="text-emerald-400">Mitigated</span></td>
              </tr>
              <tr>
                <td className="p-3 text-white font-semibold">MT5 Build update breaks CLI compiler</td>
                <td className="p-3 text-cyan-400">Phase 0</td>
                <td className="p-3">Windows Spot VM auto-updates disabled via GPO. MetaEditor manually updated only after sandbox testing.</td>
                <td className="p-3"><span className="text-emerald-400">Mitigated</span></td>
              </tr>
              <tr>
                <td className="p-3 text-white font-semibold">Azure Windows Spot Instance eviction</td>
                <td className="p-3 text-cyan-400">Phase 0 & 6</td>
                <td className="p-3">Pre-configured AWS Windows AMI backup standby. Redis BullMQ queue persists pending jobs safely.</td>
                <td className="p-3"><span className="text-cyan-400">Active Monitoring</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
