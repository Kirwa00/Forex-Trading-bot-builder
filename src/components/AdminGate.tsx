import { useEffect, useState } from 'react';
import { Lock, RefreshCw, LogOut, ArrowLeft } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { SdlcPhaseTracker } from './SdlcPhaseTracker';

interface AdminGateProps {
  onExit: () => void;
}

/**
 * Operator surface, reachable only at /?view=admin and only past the password.
 * These panels used to sit in the public navigation with no check at all.
 */
export const AdminGate = ({ onExit }: AdminGateProps) => {
  const [status, setStatus] = useState<'loading' | 'locked' | 'open' | 'unconfigured'>('loading');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [panel, setPanel] = useState<'admin' | 'roadmap'>('admin');

  useEffect(() => {
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setStatus('open');
        else if (!data.configured) setStatus('unconfigured');
        else setStatus('locked');
      })
      .catch(() => setStatus('locked'));
  }, []);

  const handleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setStatus('open');
        setPassword('');
      } else {
        setError(data.error || 'Incorrect password.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setStatus('locked');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-slate-600 animate-spin" />
      </div>
    );
  }

  if (status !== 'open') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full">
              <Lock className="w-3 h-3" />
              <span>Operators only</span>
            </div>
            <h1 className="text-lg font-bold text-white">StratoBot admin</h1>
          </div>

          {status === 'unconfigured' ? (
            <p className="text-xs text-slate-400 leading-relaxed">
              Admin access is not configured on this deployment. Set{' '}
              <code className="text-cyan-300 font-mono">ADMIN_PASSWORD</code> in the environment to
              enable it.
            </p>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && password && handleLogin()}
                placeholder="Password"
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
              />

              {error && (
                <p className="text-xs text-red-300 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleLogin}
                disabled={!password || isSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                {isSubmitting ? 'Checking…' : 'Sign in'}
              </button>
            </div>
          )}

          <button
            onClick={onExit}
            className="w-full text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to StratoBot</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-white font-mono">StratoBot admin</span>
            <nav className="flex gap-1 text-xs">
              {([
                ['admin', 'Curation'],
                ['roadmap', 'Roadmap'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setPanel(id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    panel === id
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 transition-colors"
            >
              View site
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {panel === 'admin' ? <AdminPanel /> : <SdlcPhaseTracker />}
      </main>
    </div>
  );
};
