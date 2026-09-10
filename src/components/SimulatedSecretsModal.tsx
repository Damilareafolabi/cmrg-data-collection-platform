import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  Download,
  AlertCircle,
  X,
  Code2,
  Terminal,
  Lock,
  ExternalLink
} from 'lucide-react';
import { fetchSecretsStatus, downloadVsCodeEnvTemplate } from '../lib/api';
import { SecretsStatusResponse, SecretItem } from '../../shared/secrets';

interface SimulatedSecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatedSecretsModal: React.FC<SimulatedSecretsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [statusData, setStatusData] = useState<SecretsStatusResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'envTemplate'>('overview');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchSecretsStatus()
        .then(data => {
          setStatusData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load secrets status:', err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyEnv = () => {
    if (!statusData) return;
    navigator.clipboard.writeText(statusData.vsCodeEnvTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadEnv = async () => {
    try {
      await downloadVsCodeEnvTemplate();
    } catch (err: any) {
      alert(`Download error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b0f17] border border-white/15 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0e1422]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Simulated Secrets & VS Code Handoff
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  Sandbox Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                All secret keys are safely simulated in this cloud workspace until transferred to VS Code.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-white/10 flex space-x-4 bg-[#080c14]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#FF2D20] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulated Secret Values ({statusData?.secrets.length || 6})
          </button>
          <button
            onClick={() => setActiveTab('envTemplate')}
            className={`pb-3 px-1 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'envTemplate'
                ? 'border-[#FF2D20] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#FF2D20]" />
            <span>VS Code .env Template</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Information Notice Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-amber-200">
                Safe Zero-Leak Sandbox Environment
              </p>
              <p className="text-slate-300 leading-relaxed">
                You do not need to input real API keys, database passwords, or JWT secrets in this cloud container.
                Every required secret is mocked with a high-entropy simulated value that allows full functionality (auth, testing, sync, export).
                When you clone or open this repo in <strong>VS Code</strong>, configure your production values in <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300 font-mono">.env</code>.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#FF2D20] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Inspecting simulated runtime secrets...</p>
            </div>
          ) : activeTab === 'overview' ? (
            /* Table of Simulated Secrets */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current Sandbox Secret Registry
                </span>
                <span className="text-xs text-slate-400">
                  Status: <strong className="text-emerald-400">100% Mock Safe</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {statusData?.secrets.map(secret => (
                  <div
                    key={secret.key}
                    className="p-4 rounded-xl bg-[#121826] border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs font-bold text-white tracking-wide">
                          {secret.key}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Simulated
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-black/40">
                          {secret.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {secret.description}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <span>Purpose:</span>
                        <span className="text-slate-300">{secret.targetPurpose}</span>
                      </p>
                    </div>

                    <div className="md:text-right space-y-1">
                      <div className="font-mono text-xs text-slate-400 bg-black/50 px-2.5 py-1 rounded-lg inline-block border border-white/5">
                        {secret.maskedValue}
                      </div>
                      <p className="text-[10px] text-slate-400 max-w-xs md:ml-auto">
                        For VS Code: {secret.recommendationForVsCode}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* VS Code .env Template Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Production .env Configuration for VS Code
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Save this content as <code className="text-white font-mono">.env</code> in your project root after opening in VS Code.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyEnv}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Copy .env</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadEnv}
                    className="px-3 py-1.5 rounded-lg bg-[#FF2D20] hover:bg-red-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .env</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-black/90 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed max-h-96">
                  {statusData?.vsCodeEnvTemplate}
                </pre>
              </div>

              {/* 3 Step VS Code Quick Guide */}
              <div className="p-4 rounded-xl bg-[#121826] border border-white/10 space-y-2">
                <div className="flex items-center space-x-2 text-white font-bold text-xs">
                  <Terminal className="w-4 h-4 text-[#FF2D20]" />
                  <span>3-Step Quick Guide in VS Code:</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>
                    Open repository in VS Code and create a file named <code className="text-white font-mono bg-black/50 px-1 py-0.5 rounded">.env</code> in the root directory.
                  </li>
                  <li>
                    Paste the template above and replace placeholder values (e.g., <code className="text-amber-300 font-mono">REPLACE_WITH_...</code>) with your live credentials.
                  </li>
                  <li>
                    Run <code className="text-white font-mono bg-black/50 px-1 py-0.5 rounded">npm run build && npm start</code> or build the Android client with <code className="text-white font-mono bg-black/50 px-1 py-0.5 rounded">cd mobile && flutter build apk --release</code>.
                  </li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0e1422] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Zero real credentials stored in sandbox. Safe for multi-tenant sessions.</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyEnv}
              className="text-slate-300 hover:text-white font-semibold cursor-pointer flex items-center space-x-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy VS Code .env</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
