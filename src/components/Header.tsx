import React from 'react';
import { Cpu, ShieldCheck, Zap, DollarSign, Activity, PlayCircle, Code2, Layers, Award } from 'lucide-react';
import { UserSubscription } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: 'KES' | 'USD';
  setCurrency: (c: 'KES' | 'USD') => void;
  subscription: UserSubscription;
  onOpenPaymentModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  subscription,
  onOpenPaymentModal,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('builder')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-white font-mono">StratoBot<span className="text-cyan-400">.AI</span></span>
                <span className="text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full uppercase tracking-wider">v1.0 MVP</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">AI-Powered MT5 Expert Advisor Generator & AST Compiler</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'builder'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Lego Builder</span>
            </button>

            <button
              onClick={() => setActiveTab('video-hub')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'video-hub'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>Video Hub</span>
              <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-emerald-900/60 text-emerald-300 rounded-full font-mono">1-Click</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Backtest Chart</span>
            </button>

            <button
              onClick={() => setActiveTab('compiler')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'compiler'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>MQL5 & Compiler</span>
            </button>

            <button
              onClick={() => setActiveTab('sdlc')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'sdlc'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>SDLC Specs</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-rose-400" />
              <span>Admin Panel</span>
            </button>
          </nav>

          {/* Right Action Controls: Currency & Subscription Badge */}
          <div className="flex items-center space-x-3">
            {/* Currency Toggle */}
            <div className="bg-slate-800/80 border border-slate-700 p-0.5 rounded-lg flex items-center text-xs font-mono">
              <button
                onClick={() => setCurrency('KES')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  currency === 'KES' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                KES (KSh)
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  currency === 'USD' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>

            {/* Subscription Tier Button */}
            {subscription.tier === 'Pro' ? (
              <div className="bg-gradient-to-r from-emerald-950 to-teal-900 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pro Tier (Unlimited)</span>
              </div>
            ) : (
              <button
                onClick={onOpenPaymentModal}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-md shadow-orange-500/20 transition-all transform hover:scale-105"
              >
                <DollarSign className="w-4 h-4" />
                <span>Upgrade to Pro (2,500 KES)</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex overflow-x-auto py-2 border-t border-slate-800 space-x-2 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'builder' ? 'bg-cyan-600 text-white' : 'text-slate-300 bg-slate-800'
            }`}
          >
            Lego Builder
          </button>
          <button
            onClick={() => setActiveTab('video-hub')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'video-hub' ? 'bg-cyan-600 text-white' : 'text-slate-300 bg-slate-800'
            }`}
          >
            Video Hub
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'simulator' ? 'bg-cyan-600 text-white' : 'text-slate-300 bg-slate-800'
            }`}
          >
            Backtest Chart
          </button>
          <button
            onClick={() => setActiveTab('compiler')}
            className={`px-3 py-3 rounded-md whitespace-nowrap ${
              activeTab === 'compiler' ? 'bg-cyan-600 text-white' : 'text-slate-300 bg-slate-800'
            }`}
          >
            MQL5 & Compiler
          </button>
          <button
            onClick={() => setActiveTab('sdlc')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'sdlc' ? 'bg-cyan-600 text-white' : 'text-slate-300 bg-slate-800'
            }`}
          >
            SDLC Roadmap
          </button>
        </div>
      </div>
    </header>
  );
};
