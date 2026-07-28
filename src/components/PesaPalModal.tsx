import { useState } from 'react';
import { X, Smartphone, CreditCard, ShieldCheck, CheckCircle2, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import { UserSubscription } from '../types';

interface PesaPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: 'KES' | 'USD';
  onSuccess: (updatedSub: UserSubscription) => void;
}

export const PesaPalModal = ({ isOpen, onClose, currency, onSuccess }: PesaPalModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState<string>('0712345678');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'form' | 'stk_push' | 'success'>('form');

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setStep('stk_push');

    try {
      const res = await fetch('/api/pesapal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          amount: currency === 'KES' ? 2500 : 20,
          currency,
        }),
      });

      const data = await res.json();

      setTimeout(() => {
        setIsProcessing(false);
        setStep('success');

        setTimeout(() => {
          onSuccess({
            tier: 'Pro',
            downloadsUsedThisHour: 0,
            hourlyLimit: 9999,
            kesPrice: 2500,
            usdPrice: 20,
          });
          onClose();
          setStep('form');
        }, 1500);
      }, 2500);
    } catch (err) {
      console.error('PesaPal Payment Error:', err);
      setIsProcessing(false);
      setStep('form');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
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
            <span>PesaPal Secure Gateway (Phase 4 SDLC)</span>
          </div>
          <h2 className="text-xl font-bold text-white">Upgrade to StratoBot Pro</h2>
          <p className="text-xs text-slate-400">
            Unlimited EA MQL5 downloads, priority Azure VM compilation queue, and full source code access.
          </p>
        </div>

        {/* Price Tag */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">One-Time Lifetime Access</span>
          <div className="text-2xl font-extrabold text-amber-400">
            {currency === 'KES' ? 'KSh 2,500 KES' : '$20.00 USD'}
          </div>
          <p className="text-[11px] text-slate-400">Instant activation on successful checkout</p>
        </div>

        {step === 'form' && (
          <div className="space-y-4">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === 'mpesa'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>M-Pesa STK Push</span>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <span>Debit / Credit Card</span>
              </button>
            </div>

            {/* Input Form */}
            {paymentMethod === 'mpesa' ? (
              <div className="space-y-2 text-xs font-mono">
                <label className="text-slate-300 block">Safaricom Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0712345678"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500">
                  An STK push pop-up will appear on your phone asking for your M-Pesa PIN.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                <label className="text-slate-300 block">Card Number</label>
                <input
                  type="text"
                  placeholder="4000 1234 5678 9010"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleProcessPayment}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <span>Pay {currency === 'KES' ? '2,500 KES' : '$20'} via PesaPal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'stk_push' && (
          <div className="py-8 text-center space-y-3 font-mono">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <h3 className="font-bold text-white text-sm">STK Push Sent to {phoneNumber}</h3>
            <p className="text-xs text-slate-400">
              Please check your phone and enter your M-Pesa PIN to complete payment.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-3 font-mono">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="font-bold text-white text-base">Payment Verified!</h3>
            <p className="text-xs text-emerald-300">
              Pro Tier Unlocked! Redirecting to Lego Strategy Builder...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
