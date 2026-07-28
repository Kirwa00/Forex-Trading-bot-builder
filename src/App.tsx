import { useState } from 'react';
import { Header } from './components/Header';
import { SdlcPhaseTracker } from './components/SdlcPhaseTracker';
import { LegoBuilder } from './components/LegoBuilder';
import { VideoHub } from './components/VideoHub';
import { SimulatorEngine } from './components/SimulatorEngine';
import { CodeAndCompiler } from './components/CodeAndCompiler';
import { PesaPalModal } from './components/PesaPalModal';
import { AdminPanel } from './components/AdminPanel';
import { StrategyBlueprint, UserSubscription } from './types';
import { INITIAL_VIDEOS } from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('builder');
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Default initial blueprint loaded from first video strategy card
  const [blueprint, setBlueprint] = useState<StrategyBlueprint>(
    INITIAL_VIDEOS[0].blueprint
  );

  // User subscription state
  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: 'Free',
    downloadsUsedThisHour: 1,
    hourlyLimit: 5,
    kesPrice: 2500,
    usdPrice: 20,
  });

  // Handler when user clicks "One-Click Load Strategy" in Video Hub
  const handleLoadStrategyFromVideo = (newBlueprint: StrategyBlueprint) => {
    setBlueprint(newBlueprint);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        subscription={subscription}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'builder' && (
          <LegoBuilder
            blueprint={blueprint}
            setBlueprint={setBlueprint}
            onSendToBacktest={() => setActiveTab('simulator')}
            onSendToCompile={() => setActiveTab('compiler')}
          />
        )}

        {activeTab === 'video-hub' && (
          <VideoHub
            onLoadStrategy={handleLoadStrategyFromVideo}
            onNavigateToBuilder={() => setActiveTab('builder')}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorEngine blueprint={blueprint} currency={currency} />
        )}

        {activeTab === 'compiler' && (
          <CodeAndCompiler blueprint={blueprint} />
        )}

        {activeTab === 'sdlc' && <SdlcPhaseTracker />}

        {activeTab === 'admin' && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-8 text-xs text-slate-400 mt-12 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">StratoBot AI</span>
            <span>—</span>
            <span>MetaTrader 5 EA Builder & Compiler Agent</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>SDLC Version: 1.0 (MVP)</span>
            <span>•</span>
            <span>Azure Windows VM Agent Ready</span>
            <span>•</span>
            <span>PesaPal M-Pesa Integrated</span>
          </div>
        </div>
      </footer>

      {/* PesaPal Checkout Modal */}
      <PesaPalModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currency={currency}
        onSuccess={(updatedSub) => setSubscription(updatedSub)}
      />
    </div>
  );
}
