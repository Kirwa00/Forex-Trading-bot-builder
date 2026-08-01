import React from 'react';
import { ShieldCheck, Zap, PlayCircle } from 'lucide-react';
import { UserSubscription } from '../types';
import { STEPS, StepId } from '../steps';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: 'KES' | 'USD';
  setCurrency: (c: 'KES' | 'USD') => void;
  subscription: UserSubscription;
  furthestStep: number;
}

/**
 * The nav presents the four steps as a numbered path rather than a menu — the
 * work is sequential and the old sibling-tab layout hid that. Admin and the
 * SDLC roadmap are operator surfaces and live behind /?view=admin.
 */
export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  subscription,
  furthestStep,
}) => {
  const activeIndex = STEPS.findIndex((s) => s.id === activeTab);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            className="flex items-center space-x-3 shrink-0"
            onClick={() => setActiveTab('describe')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="font-bold text-lg tracking-tight text-white font-mono block leading-none">
                StratoBot<span className="text-cyan-400">.AI</span>
              </span>
              <p className="text-[11px] text-slate-400 hidden lg:block mt-0.5">
                Trading strategies into MetaTrader 5 robots
              </p>
            </div>
          </button>

          {/* Step path */}
          <nav className="hidden md:flex items-center flex-1 justify-center" aria-label="Progress">
            {STEPS.map((step, index) => {
              const isActive = activeTab === step.id;
              const isReached = index <= furthestStep;
              const isDone = index < activeIndex;

              return (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className={`h-px w-5 lg:w-8 mx-1 ${
                        index <= furthestStep ? 'bg-cyan-700' : 'bg-slate-800'
                      }`}
                    />
                  )}
                  <button
                    onClick={() => isReached && setActiveTab(step.id)}
                    disabled={!isReached}
                    aria-current={isActive ? 'step' : undefined}
                    title={isReached ? step.blurb : `Finish step ${index} first`}
                    className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40'
                        : isReached
                          ? 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
                          : 'text-slate-600 cursor-not-allowed border border-transparent'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950'
                          : isDone
                            ? 'bg-cyan-900 text-cyan-300'
                            : isReached
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-slate-900 text-slate-700 border border-slate-800'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="whitespace-nowrap">{step.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('examples')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeTab === 'examples'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Examples</span>
            </button>

            <div className="bg-slate-800/80 border border-slate-700 p-0.5 rounded-lg flex items-center text-[11px] font-mono">
              {(['KES', 'USD'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    currency === c ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {subscription.tier === 'Pro' && (
              <div className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pro</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export type { StepId };
