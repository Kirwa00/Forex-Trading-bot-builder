import { useState, useMemo } from 'react';
import {
  Download,
  ShieldCheck,
  ShieldAlert,
  Check,
  Copy,
  RefreshCw,
  FileCode,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { StrategyBlueprint, StrategyCheck, UserSubscription } from '../types';
import { generateMql5FromBlueprint } from '../utils/mql5Generator';

interface DownloadPortalProps {
  blueprint: StrategyBlueprint;
  subscription: UserSubscription;
  currency: 'KES' | 'USD';
  onOpenPaymentModal: () => void;
}

const PREVIEW_LINES = 22;

/**
 * Step 4 — the thing the user came for.
 *
 * The deliverable is the .mq5 source: MetaTrader compiles it locally the first
 * time you attach it to a chart. There is no server-side .ex5 build, so this
 * screen never claims one.
 */
export const DownloadPortal = ({
  blueprint,
  subscription,
  currency,
  onOpenPaymentModal,
}: DownloadPortalProps) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [check, setCheck] = useState<StrategyCheck | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const mql5Code = useMemo(() => generateMql5FromBlueprint(blueprint), [blueprint]);
  const fileName = `${blueprint.title.replace(/[^a-z0-9]+/gi, '_').slice(0, 60) || 'StratoBot_EA'}.mq5`;
  const isPro = subscription.tier === 'Pro';
  const price = currency === 'KES' ? 'KSh 2,500' : '$20';

  const previewCode = isPro
    ? mql5Code
    : mql5Code.split('\n').slice(0, PREVIEW_LINES).join('\n');

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/check-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mql5Code }),
      });
      const data = await res.json();
      if (data.result) setCheck(data.result);
    } catch (err) {
      console.error('Strategy check failed:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mql5Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const res = await fetch('/api/download/mq5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint }),
      });

      if (res.status === 402) {
        setDownloadError('This download is part of StratoBot Pro.');
        onOpenPaymentModal();
        return;
      }
      if (!res.ok) {
        setDownloadError('Could not prepare your file. Please try again.');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadError('Could not reach the server. Check your connection and try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Headline + primary action */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-mono block">
            Ready to install
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight text-balance">
            {blueprint.title}
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Your strategy is written as a MetaTrader 5 Expert Advisor. Download the file, drop it
            into MetaTrader, and it compiles on your machine the first time you attach it to a chart.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs font-mono">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Platform</span>
            <span className="text-slate-200">MetaTrader 5</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">File</span>
            <span className="text-slate-200 truncate block">{fileName}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Market</span>
            <span className="text-slate-200">
              {blueprint.symbol} · {blueprint.timeframe}
            </span>
          </div>
        </div>

        {downloadError && (
          <div className="flex items-start gap-2 text-xs text-amber-200 bg-amber-950/40 border border-amber-900 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{downloadError}</span>
          </div>
        )}

        {isPro ? (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Preparing your file…</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download {fileName}</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onOpenPaymentModal}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock and download — {price}</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              One payment, unlimited downloads. Pay with M-Pesa or card through PesaPal.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs text-white font-mono">{fileName}</span>
            </div>

            {isPro && (
              <button
                onClick={handleCopy}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div className="relative">
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono overflow-x-auto max-h-[520px] overflow-y-auto leading-relaxed">
              <pre className="text-[11px] text-cyan-200">{previewCode}</pre>
            </div>

            {!isPro && (
              <>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent rounded-b-xl pointer-events-none" />
                <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4">
                  <span className="text-xs text-slate-300 font-medium text-center">
                    Showing the first {PREVIEW_LINES} lines of {mql5Code.split('\n').length}
                  </span>
                  <button
                    onClick={onOpenPaymentModal}
                    className="text-xs font-bold text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                  >
                    Unlock the full file
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Checks + install guide */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Safety check
              </h2>
              {check && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                    check.passed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {check.passed ? <Check className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  <span>{check.passed ? 'Passed' : 'Problems found'}</span>
                </span>
              )}
            </div>

            {!check ? (
              <div className="py-6 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  We scan the generated code for unsafe patterns and outdated MetaTrader 4 functions
                  before you install it.
                </p>
                <button
                  onClick={handleCheck}
                  disabled={isChecking}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking…</span>
                    </>
                  ) : (
                    <span>Run the check</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {[
                    { label: 'Lines', value: check.lineCount.toLocaleString() },
                    { label: 'Errors', value: check.errorCount },
                    { label: 'Warnings', value: check.warningCount },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                      <span className="text-[9px] text-slate-500 uppercase block">{stat.label}</span>
                      <span className="text-sm font-bold text-white tabular-nums">{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {check.checks.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-emerald-300 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/40"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px]">{rule}</span>
                    </div>
                  ))}
                </div>

                {check.problems.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {check.problems.map((problem, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-[11px] ${
                          problem.severity === 'error'
                            ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                            : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                        }`}
                      >
                        <span className="font-bold font-mono uppercase block mb-0.5">
                          Line {problem.line || '?'}
                        </span>
                        <p>{problem.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-500 font-mono">
                  Checked in {check.durationMs}ms · source only, not a MetaTrader compile
                </p>
              </div>
            )}
          </div>

          {/* Install guide — the step everyone gets stuck on */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono border-b border-slate-800 pb-3">
              Installing it in MetaTrader 5
            </h2>
            <ol className="space-y-2.5 text-xs text-slate-300">
              {[
                'In MetaTrader 5, open File → Open Data Folder.',
                `Copy ${fileName} into MQL5 → Experts.`,
                'Back in MetaTrader, right-click Expert Advisors in the Navigator and choose Refresh.',
                'Drag the strategy onto a chart. It compiles on first load.',
                'In Tools → Options → Expert Advisors, tick "Allow algorithmic trading".',
              ].map((stepText, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{stepText}</span>
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-900/50 rounded-lg p-2.5 leading-relaxed">
              Test on a demo account first. This robot places real trades with real money once you
              attach it to a live account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
