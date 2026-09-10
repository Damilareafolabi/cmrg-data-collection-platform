import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Smartphone,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  Users,
  Layers,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  FileText
} from 'lucide-react';
import { DashboardStats, Submission, Form, Project } from '../../shared/types';

interface DashboardViewProps {
  stats: DashboardStats;
  recentSubmissions: Submission[];
  forms: Form[];
  projects: Project[];
  onNavigate: (view: any) => void;
  onOpenImport: () => void;
  onSelectFormForEdit: (form: Form) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentSubmissions,
  forms,
  projects,
  onNavigate,
  onOpenImport,
  onSelectFormForEdit
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Actions */}
      <div className="bg-[#0b1019] text-white rounded-2xl p-6 shadow-xl border border-white/10 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        {/* Decorative subtle pattern */}
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <div className="w-32 h-32 bg-[#FF2D20] rounded-full blur-2xl" />
        </div>

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-[#FF2D20] rounded-[1px]" />
              <span className="w-2 h-2 bg-[#FF2D20] rounded-[1px]" />
              <span className="w-2 h-2 bg-[#FF2D20] rounded-[1px]" />
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#FF2D20]/20 text-[#FF2D20] px-2.5 py-0.5 rounded border border-[#FF2D20]/30">
              OPERATIONAL READY
            </span>
            <span className="text-xs text-slate-400">RC378525 • Internal Devteam</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            CMRG Central Operations Console
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Welcome to CMRG! Powered by CMRG internal devteam. Real-time telemetry, automated skip logic verification, and zero-rebuild questionnaire import.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            id="dash-btn-import-form"
            onClick={onOpenImport}
            className="px-4 py-2.5 bg-[#FF2D20] hover:bg-[#E0261A] text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import Existing Form</span>
          </button>

          <button
            id="dash-btn-open-collect"
            onClick={() => onNavigate('collect')}
            className="px-4 py-2.5 bg-black/80 hover:bg-black text-white font-bold text-xs rounded-xl border border-white/20 hover:border-[#FF2D20] flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#FF2D20]" />
            <span>Open Field Collect App</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">{stats.totalSubmissions}</div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>{stats.approvedSubmissions} approved by QA</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Questionnaires</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">{stats.publishedForms}</div>
          <p className="text-[11px] text-slate-500">
            {stats.totalForms} total forms in project library
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Projects</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">{stats.totalProjects}</div>
          <p className="text-[11px] text-slate-500">
            Nationwide & Regional studies
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Field Enumerators</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">{stats.activeEnumerators}</div>
          <p className="text-[11px] text-amber-700 font-semibold">
            {stats.pendingSyncSubmissions} queued offline
          </p>
        </div>
      </div>

      {/* Grid: Forms Overview & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Deployed Questionnaires */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Questionnaires in Field
              </h3>
            </div>
            <button
              onClick={() => onNavigate('forms')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {forms.slice(0, 4).map((f) => (
              <div
                key={f.id}
                onClick={() => onSelectFormForEdit(f)}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-emerald-500/50 hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{f.title}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono mt-0.5">
                    <span>{f.questions.length} questions</span>
                    <span>•</span>
                    <span>v{f.currentVersion}.0</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    f.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Real-Time Recent Submissions */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recent Field Submissions
              </h3>
            </div>
            <button
              onClick={() => onNavigate('submissions')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View Data</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentSubmissions.slice(0, 4).map((s, index) => (
              <div
                key={`${s.id || 'sub'}-${index}`}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{s.formTitle}</span>
                    {s.geolocation && (
                      <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
                        <MapPin className="w-2.5 h-2.5 mr-0.5" />
                        <span>GPS Fix</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    By <span className="font-medium text-slate-700">{s.enumeratorName}</span> • {new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    s.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
