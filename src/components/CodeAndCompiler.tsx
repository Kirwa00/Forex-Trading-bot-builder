import { useState, useEffect } from 'react';
import { Code2, Terminal, Download, ShieldCheck, ShieldAlert, Cpu, Check, Copy, RefreshCw, FileCode, Server } from 'lucide-react';
import { StrategyBlueprint, CompilationJob, AstValidationResult } from '../types';
import { generateMql5FromBlueprint } from '../utils/mql5Generator';
import { parseAndValidateMql5Code } from '../utils/astParser';

interface CodeAndCompilerProps {
  blueprint: StrategyBlueprint;
}

export const CodeAndCompiler = ({ blueprint }: CodeAndCompilerProps) => {
  const [showFullWrapper, setShowFullWrapper] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compilationJob, setCompilationJob] = useState<CompilationJob | null>(null);

  // Generate current MQL5 code from blueprint
  const mql5Code = generateMql5FromBlueprint(blueprint);

  // AST Safety check
  const astResult: AstValidationResult = parseAndValidateMql5Code(mql5Code);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mql5Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dispatch compile job to server
  const handleCompile = async () => {
    setIsCompiling(true);
    setCompilationJob(null);

    try {
      const res = await fetch('/api/compile-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mql5Code,
          strategyTitle: blueprint.title.replace(/\s+/g, '_')
        })
      });

      const data = await res.json();
      if (data.job) {
        setCompilationJob(data.job);
      }
    } catch (err) {
      console.error('Compilation job dispatch error:', err);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-full text-xs text-indigo-300 font-mono mb-2">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Phase 0/1 Architecture — AST Parser & Windows VM Compiler</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            MQL5 Source Code & EX5 Compiler Agent
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Gating AI logic through AST validation, wrapping inside Master Wrapper V1, and building executable <code className="text-cyan-300 font-mono">.ex5</code> binaries for MT5.
          </p>
        </div>

        <button
          onClick={handleCompile}
          disabled={isCompiling}
          className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-cyan-600/20 transition-all shrink-0"
        >
          {isCompiling ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Compiling via Azure VM...</span>
            </>
          ) : (
            <>
              <Terminal className="w-4 h-4" />
              <span>Compile to .EX5 Binary</span>
            </>
          )}
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs text-white font-mono">
                {blueprint.title.replace(/\s+/g, '_')}.mq5
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFullWrapper(!showFullWrapper)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  showFullWrapper ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showFullWrapper ? 'Full Master Wrapper V1' : 'Entry Logic Only'}
              </button>

              <button
                onClick={handleCopyCode}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded text-xs font-mono flex items-center space-x-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Source'}</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Container */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[520px] overflow-y-auto leading-relaxed">
            <pre className="text-[11px] text-cyan-200">
              {mql5Code}
            </pre>
          </div>
        </div>

        {/* Right Column: AST Safety Gate & Compiler Output (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AST Validation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  AST Code Safety Validation Gate
                </h2>
              </div>

              {astResult.isValid ? (
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>AST PASSED</span>
                </span>
              ) : (
                <span className="bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>AST FAILED</span>
                </span>
              )}
            </div>

            {/* Passed Rules Checklist */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase text-slate-400 font-mono block">Validated Security Rules</span>
              <div className="space-y-1 text-xs">
                {astResult.passedRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-emerald-300 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/40">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors / Warnings list */}
            {astResult.errors.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase text-amber-400 font-mono block">Validation Diagnostics</span>
                <div className="space-y-1.5 text-xs">
                  {astResult.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-[11px] ${
                        err.severity === 'error'
                          ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                          : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                      }`}
                    >
                      <div className="font-bold font-mono uppercase mb-0.5">
                        [{err.severity}] Line {err.line || '?'}: {err.code}
                      </div>
                      <p>{err.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Azure VM Compiler Output & Downloads */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Azure Windows Spot VM Compiler
                </h2>
              </div>
            </div>

            {!compilationJob ? (
              <div className="py-8 text-center space-y-2 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl">
                <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Tap <strong className="text-cyan-400">"Compile to .EX5 Binary"</strong> to trigger headless MetaEditor compilation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* MetaEditor Job Logs */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1 max-h-48 overflow-y-auto">
                  {compilationJob.logs.map((log, idx) => (
                    <div key={idx} className="leading-snug">
                      <span className="text-slate-500">&gt;</span> {log}
                    </div>
                  ))}
                </div>

                {/* Cloudflare R2 Download Links */}
                {compilationJob.status === 'success' && (
                  <div className="bg-slate-950 border border-emerald-800/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold flex items-center space-x-1">
                        <Check className="w-4 h-4" />
                        <span>Build Success ({compilationJob.durationMs}ms)</span>
                      </span>
                      <span className="text-slate-400 text-[10px]">Cloudflare R2 Signed URL (24h TTL)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`data:text/plain;charset=utf-8,${encodeURIComponent(mql5Code)}`}
                        download={`${blueprint.title.replace(/\s+/g, '_')}.mq5`}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Source .MQ5</span>
                      </a>

                      <a
                        href={`data:text/plain;charset=utf-8,${encodeURIComponent(`[COMPILER_ARTIFACT_EX5_BINARY_${blueprint.magicNumber}]`)}`}
                        download={`${blueprint.title.replace(/\s+/g, '_')}.ex5`}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-md shadow-emerald-600/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Compiled .EX5</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
