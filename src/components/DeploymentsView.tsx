import React, { useState } from 'react';
import {
  Send,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  Plus,
  Trash2,
  X,
  RotateCw
} from 'lucide-react';
import { Deployment, Form, User } from '../../shared/types';
import { deployForm } from '../lib/api';

interface DeploymentsViewProps {
  deployments: Deployment[];
  forms: Form[];
  users: User[];
  onRefresh: () => Promise<void>;
}

export const DeploymentsView: React.FC<DeploymentsViewProps> = ({
  deployments,
  forms,
  users,
  onRefresh
}) => {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id || '');
  const [targetType, setTargetType] = useState<'ALL' | 'ENUMERATOR'>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);

  const enumerators = users.filter(u => u.role === 'ENUMERATOR');

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = forms.find(f => f.id === selectedFormId);
    if (!form) return;

    const assignedUser = targetType === 'ENUMERATOR' ? users.find(u => u.id === selectedUserId) : undefined;

    setIsDeploying(true);
    try {
      await deployForm({
        projectId: form.projectId,
        formId: form.id,
        formTitle: form.title,
        formVersionId: form.currentVersionId || 'v1',
        versionNumber: form.currentVersion || 1,
        targetType,
        assignedToUserId: assignedUser?.id,
        assignedToUserName: assignedUser?.name,
        status: 'ACTIVE'
      });
      setIsDeployModalOpen(false);
      await onRefresh();
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Form Deployments & Device Fleet</h2>
          <p className="text-xs text-slate-500">
            Push questionnaire versions to registered enumerator smartphones and manage active campaigns.
          </p>
        </div>

        <button
          onClick={() => setIsDeployModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-700/20 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Deploy Questionnaire Version</span>
        </button>
      </div>

      {/* Active Deployments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Field Deployments ({deployments.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Deployment ID</th>
                <th className="py-3 px-4">Questionnaire</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Access Code</th>
                <th className="py-3 px-4">Target Audience</th>
                <th className="py-3 px-4">Deployed Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {deployments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active deployments. Deploy a questionnaire to field enumerators.
                  </td>
                </tr>
              ) : (
                deployments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{d.id.slice(0, 16)}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{d.formTitle}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">v{d.versionNumber}.0</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded bg-amber-100 px-2 py-1 font-mono font-bold text-amber-900">
                        {d.accessCode || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {d.targetType === 'ALL' ? (
                        <span className="text-blue-700 font-semibold">All Field Devices</span>
                      ) : (
                        <span>{d.assignedToUserName || 'Designated Enumerator'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(d.deployedAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered Devices Fleet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Registered Enumerator Devices
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {enumerators.map((e) => (
            <div key={e.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-900">{e.name}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">
                  {e.deviceId || 'DEV-CMRG-MOBILE-01'}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">
                  Last Sync: {e.lastSyncAt ? new Date(e.lastSyncAt).toLocaleTimeString() : 'Recent'}
                </p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Device Authorized" />
            </div>
          ))}
        </div>
      </div>

      {/* Deploy Modal */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Deploy Questionnaire to Fleet</h3>
              <button onClick={() => setIsDeployModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeploy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Questionnaire
                </label>
                <select
                  value={selectedFormId}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.title} (v{f.currentVersion}.0 - {f.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Field Staff
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  <option value="ALL">All Authorized Field Devices</option>
                  <option value="ENUMERATOR">Specific Enumerator</option>
                </select>
              </div>

              {targetType === 'ENUMERATOR' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Enumerator
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="">-- Choose Enumerator --</option>
                    {enumerators.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.deviceId || 'DEV-MOBILE'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeploying}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {isDeploying ? 'Deploying...' : 'Deploy to Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
