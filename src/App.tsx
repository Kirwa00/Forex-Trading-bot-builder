import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LegoBuilder } from './components/LegoBuilder';
import { VideoHub } from './components/VideoHub';
import { SimulatorEngine } from './components/SimulatorEngine';
import { DownloadPortal } from './components/DownloadPortal';
import { PesaPalModal } from './components/PesaPalModal';
import { PaymentReceipt, ReceiptDetails } from './components/PaymentReceipt';
import { AdminGate } from './components/AdminGate';
import { StrategyBlueprint, UserSubscription } from './types';
import { INITIAL_VIDEOS } from './data/initialData';
import { stepIndex } from './steps';

export default function App() {
  // Operator surface lives off the main path entirely.
  const [isAdminView, setIsAdminView] = useState<boolean>(
    () => new URLSearchParams(window.location.search).get('view') === 'admin'
  );

  const [activeTab, setActiveTab] = useState<string>('describe');
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null);

  /** How far along the path the user has unlocked. Gates the later steps. */
  const [furthestStep, setFurthestStep] = useState<number>(0);

  const [blueprint, setBlueprint] = useState<StrategyBlueprint>(
    INITIAL_VIDEOS[0].blueprint
  );

  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: 'Free',
    downloadsUsedThisHour: 0,
    hourlyLimit: 5,
    kesPrice: 2500,
    usdPrice: 20,
  });

  const [paymentNotice, setPaymentNotice] = useState<
    { kind: 'pending' | 'error'; message: string } | null
  >(null);

  const applyTier = (tier: 'Free' | 'Pro') =>
    setSubscription((prev) => ({
      ...prev,
      tier,
      hourlyLimit: tier === 'Pro' ? 9999 : 5,
    }));

  /** Move to a step, remembering the furthest point reached. */
  const goToStep = (id: string) => {
    setActiveTab(id);
    const index = stepIndex(id);
    if (index > -1) setFurthestStep((prev) => Math.max(prev, index));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // On load: ask the server what this browser is entitled to, and if PesaPal
  // has just redirected back, verify that transaction before trusting it.
  useEffect(() => {
    if (isAdminView) return;

    const params = new URLSearchParams(window.location.search);
    const orderTrackingId = params.get('OrderTrackingId');

    const clearQuery = () => window.history.replaceState({}, '', window.location.pathname);

    const verifyReturn = async (trackingId: string) => {
      setPaymentNotice({ kind: 'pending', message: 'Verifying your payment with PesaPal…' });
      try {
        const res = await fetch(
          `/api/pesapal/status?orderTrackingId=${encodeURIComponent(trackingId)}`
        );
        const data = await res.json();

        if (!res.ok) {
          setPaymentNotice({ kind: 'error', message: data.error || 'Could not verify payment.' });
          return;
        }

        if (data.status === 'COMPLETED' && data.tier === 'Pro') {
          applyTier('Pro');
          setPaymentNotice(null);
          setReceipt({
            merchantReference: data.merchantReference,
            confirmationCode: data.confirmationCode,
            amount: data.amount,
            currency: data.currency,
            paymentMethod: data.paymentMethod,
          });
          setFurthestStep(3);
        } else if (data.status === 'PENDING') {
          setPaymentNotice({
            kind: 'pending',
            message: 'PesaPal has not confirmed this payment yet. Refresh in a moment.',
          });
        } else {
          setPaymentNotice({
            kind: 'error',
            message: data.description || 'Payment was not completed.',
          });
        }
      } catch {
        setPaymentNotice({ kind: 'error', message: 'Could not reach the server to verify payment.' });
      } finally {
        clearQuery();
      }
    };

    const loadEntitlement = async () => {
      try {
        const res = await fetch('/api/me/entitlement');
        const data = await res.json();
        if (data?.tier === 'Pro') applyTier('Pro');
      } catch {
        // Offline or server down — stay on Free.
      }
    };

    if (orderTrackingId) {
      verifyReturn(orderTrackingId);
    } else {
      loadEntitlement();
    }
  }, [isAdminView]);

  const exitAdmin = () => {
    window.history.replaceState({}, '', window.location.pathname);
    setIsAdminView(false);
  };

  if (isAdminView) return <AdminGate onExit={exitAdmin} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-black">
      <Header
        activeTab={activeTab}
        setActiveTab={goToStep}
        currency={currency}
        setCurrency={setCurrency}
        subscription={subscription}
        furthestStep={furthestStep}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-6">
        {paymentNotice && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-xs font-mono flex items-center justify-between gap-4 ${
              paymentNotice.kind === 'error'
                ? 'bg-red-950/50 border-red-900 text-red-300'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <span>{paymentNotice.message}</span>
            <button
              onClick={() => setPaymentNotice(null)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              Dismiss
            </button>
          </div>
        )}

        {(activeTab === 'describe' || activeTab === 'tune') && (
          <LegoBuilder
            blueprint={blueprint}
            setBlueprint={setBlueprint}
            view={activeTab === 'describe' ? 'describe' : 'tune'}
            onGenerated={() => goToStep('tune')}
            onSendToBacktest={() => goToStep('test')}
            onSendToCompile={() => goToStep('download')}
          />
        )}

        {activeTab === 'test' && (
          <SimulatorEngine
            blueprint={blueprint}
            currency={currency}
            onContinue={() => goToStep('download')}
          />
        )}

        {activeTab === 'download' && (
          <DownloadPortal
            blueprint={blueprint}
            subscription={subscription}
            currency={currency}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          />
        )}

        {activeTab === 'examples' && (
          <VideoHub
            onLoadStrategy={(newBlueprint) => setBlueprint(newBlueprint)}
            onNavigateToBuilder={() => goToStep('tune')}
          />
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60 py-8 text-xs text-slate-500 mt-12 mb-20 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>
            <strong className="text-slate-300">StratoBot AI</strong> — trading strategies into
            MetaTrader 5 robots
          </span>
          <span className="max-w-md leading-relaxed">
            Trading carries risk. Test on a demo account before risking real money.
          </span>
        </div>
      </footer>

      <BottomNav activeTab={activeTab} setActiveTab={goToStep} furthestStep={furthestStep} />

      <PesaPalModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currency={currency}
      />

      {receipt && (
        <PaymentReceipt
          receipt={receipt}
          onContinue={() => {
            setReceipt(null);
            goToStep('download');
          }}
          onDismiss={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
