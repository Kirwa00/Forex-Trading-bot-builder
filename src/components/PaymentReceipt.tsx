import { CheckCircle2, ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export interface ReceiptDetails {
  merchantReference: string;
  confirmationCode?: string;
  amount: number;
  currency: 'KES' | 'USD';
  paymentMethod?: string;
}

interface PaymentReceiptProps {
  receipt: ReceiptDetails;
  onContinue: () => void;
  onDismiss: () => void;
}

/**
 * Shown once, after PesaPal confirms. With no user accounts behind the product,
 * this record is the only proof of purchase the buyer will hold — so it names
 * the confirmation code, amount and method rather than just saying "success".
 */
export const PaymentReceipt = ({ receipt, onContinue, onDismiss }: PaymentReceiptProps) => {
  const [copied, setCopied] = useState(false);

  const reference = receipt.confirmationCode || receipt.merchantReference;
  const formattedAmount =
    receipt.currency === 'KES'
      ? `KSh ${receipt.amount.toLocaleString()}`
      : `$${receipt.amount.toLocaleString()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-800/60 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Payment received</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You now have unlimited downloads. Keep the reference below — it's your proof of purchase.
          </p>
        </div>

        <dl className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs font-mono">
          <div className="flex items-center justify-between p-3">
            <dt className="text-slate-400">Reference</dt>
            <dd className="flex items-center gap-2">
              <span className="text-white">{reference}</span>
              <button
                onClick={handleCopy}
                title="Copy reference"
                className="text-slate-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between p-3">
            <dt className="text-slate-400">Amount</dt>
            <dd className="text-white">{formattedAmount}</dd>
          </div>
          {receipt.paymentMethod && (
            <div className="flex items-center justify-between p-3">
              <dt className="text-slate-400">Method</dt>
              <dd className="text-white">{receipt.paymentMethod}</dd>
            </div>
          )}
          <div className="flex items-center justify-between p-3">
            <dt className="text-slate-400">Status</dt>
            <dd className="text-emerald-400 font-bold">Confirmed</dd>
          </div>
        </dl>

        <div className="space-y-2">
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
          >
            <span>Download your bot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
