import { useState } from 'react';
import { X, ShieldCheck, Lock, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

interface PesaPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: 'KES' | 'USD';
}

/**
 * Collects the billing details PesaPal requires, then hands off to their hosted
 * checkout. Card and M-Pesa PIN entry happen on PesaPal's page, never here —
 * this app must not touch card numbers or PINs.
 *
 * The tier is granted server-side once the payment is verified on return, so
 * there is no onSuccess callback: nothing about the outcome is decided here.
 */
export const PesaPalModal = ({ isOpen, onClose, currency }: PesaPalModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/pesapal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, email, firstName, lastName, currency }),
      });

      const data = await res.json();

      if (!res.ok || !data.redirectUrl) {
        setError(data.error || 'Could not start checkout. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Hand off to PesaPal. They redirect back to /?payment=return with the
      // OrderTrackingId, which App.tsx verifies against the server.
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error('PesaPal checkout error:', err);
      setError('Network error. Please check your connection and try again.');
      setIsProcessing(false);
    }
  };

  const canSubmit = email.trim() !== '' && phoneNumber.trim() !== '' && !isProcessing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-xs text-amber-400 font-mono font-bold bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full">
            <Lock className="w-3 h-3" />
            <span>PesaPal Secure Gateway</span>
          </div>
          <h2 className="text-xl font-bold text-white">Upgrade to StratoBot Pro</h2>
          <p className="text-xs text-slate-400">
            Unlimited EA MQL5 downloads, priority compilation queue, and full source code access.
          </p>
        </div>

        {/* Price Tag */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">One-Time Lifetime Access</span>
          <div className="text-2xl font-extrabold text-amber-400">
            {currency === 'KES' ? 'KSh 2,500 KES' : '$20.00 USD'}
          </div>
          <p className="text-[11px] text-slate-400">Activated once PesaPal confirms the payment</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-slate-300 block">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-300 block">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Wanjiru"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Your Pro access is tied to this address — use one you can access.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 block">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712345678"
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start space-x-2 text-xs text-red-300 bg-red-950/50 border border-red-900 rounded-xl p-3 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleProcessPayment}
            disabled={!canSubmit}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Redirecting to PesaPal…</span>
              </>
            ) : (
              <>
                <span>Continue to PesaPal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>You'll pay on PesaPal's secure page — M-Pesa or card.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
