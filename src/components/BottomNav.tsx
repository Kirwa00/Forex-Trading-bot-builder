import { MessageSquareText, Sliders, LineChart, Download, PlayCircle } from 'lucide-react';
import { STEPS } from '../steps';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  furthestStep: number;
}

const ICONS = [MessageSquareText, Sliders, LineChart, Download];

/**
 * Phone navigation, ported from the Stitch mobile screens. The app is priced in
 * KES and paid via M-Pesa, so phone is the likely default surface — the old
 * horizontally-scrolling tab strip hid half the destinations off-screen.
 */
export const BottomNav = ({ activeTab, setActiveTab, furthestStep }: BottomNavProps) => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
    <div className="grid grid-cols-5">
      {STEPS.map((step, index) => {
        const Icon = ICONS[index];
        const isActive = activeTab === step.id;
        const isReached = index <= furthestStep;

        return (
          <button
            key={step.id}
            onClick={() => isReached && setActiveTab(step.id)}
            disabled={!isReached}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-cyan-300'
                : isReached
                  ? 'text-slate-400'
                  : 'text-slate-700'
            }`}
          >
            <span className="relative">
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400" />
              )}
            </span>
            <span>{step.short}</span>
          </button>
        );
      })}

      <button
        onClick={() => setActiveTab('examples')}
        aria-current={activeTab === 'examples' ? 'page' : undefined}
        className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
          activeTab === 'examples' ? 'text-emerald-300' : 'text-slate-400'
        }`}
      >
        <PlayCircle className="w-5 h-5" />
        <span>Examples</span>
      </button>
    </div>
  </nav>
);
