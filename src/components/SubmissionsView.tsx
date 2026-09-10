import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Flag,
  MapPin,
  Clock,
  User,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { Submission, Form, Project } from '../../shared/types';
import { reviewSubmission } from '../lib/api';

interface SubmissionsViewProps {
  submissions: Submission[];
  forms: Form[];
  projects: Project[];
  onRefresh: () => Promise<void>;
  currentUser: { name: string };
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  submissions,
  forms,
  projects,
  onRefresh,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormFilter, setSelectedFormFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);

  // Review state
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED' | 'FLAGGED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Filtered submissions
  const filtered = submissions.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.clientSubmissionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.enumeratorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.formTitle && s.formTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesForm = selectedFormFilter ? s.formId === selectedFormFilter : true;
    const matchesStatus = selectedStatusFilter ? s.status === selectedStatusFilter : true;

    return matchesSearch && matchesForm && matchesStatus;
  });

  const handleApplyReview = async () => {
    if (!activeSubmission) return;
    setIsSubmittingReview(true);
    try {
      await reviewSubmission(activeSubmission.id, currentUser.name, reviewStatus, reviewNotes);
      await onRefresh();
      // Update local active record
      setActiveSubmission(prev => prev ? {
        ...prev,
        status: reviewStatus,
        review: {
          reviewedBy: currentUser.name,
          reviewedAt: new Date().toISOString(),
          status: reviewStatus,
          comments: reviewNotes
        }
      } : null);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const downloadExport = (format: 'xlsx' | 'csv' | 'json') => {
    const params = new URLSearchParams();
    if (selectedFormFilter) params.set('formId', selectedFormFilter);
    const url = `/api/export/${format}?${params.toString()}`;
    window.location.href = url;
  };

  // Find form questions for human-readable answer display
  const targetForm = activeSubmission ? forms.find(f => f.id === activeSubmission.formId) : null;

  return (
    <div className="space-y-5">
      {/* Top Filter & Export Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, enumerator, form..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Form Filter */}
          <select
            value={selectedFormFilter}
            onChange={(e) => setSelectedFormFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Questionnaires</option>
            {forms.map(f => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Review Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed / Pending Review</option>
            <option value="FLAGGED">Flagged</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Real Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-export-json"
            onClick={() => downloadExport('json')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Export complete submissions data as structured JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export JSON</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={() => downloadExport('csv')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-export-xlsx"
            onClick={() => downloadExport('xlsx')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Submission ID</th>
                <th className="py-3 px-4">Questionnaire</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Enumerator</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">GPS Fix</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No submissions matching your criteria
                  </td>
                </tr>
              ) : (
                filtered.map((s, index) => (
                  <tr
                    key={`${s.id || s.clientSubmissionId || 'sub'}-${index}`}
                    onClick={() => { setActiveSubmission(s); setReviewNotes(s.review?.comments || ''); }}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {s.id.slice(0, 16)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {s.formTitle || s.formId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      v{s.versionNumber}.0
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {s.enumeratorName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(s.submittedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {s.geolocation ? (
                        <span className="inline-flex items-center space-x-1 font-mono text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <MapPin className="w-3 h-3" />
                          <span>{s.geolocation.latitude.toFixed(3)}, {s.geolocation.longitude.toFixed(3)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        s.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : s.status === 'FLAGGED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="text-slate-400 hover:text-slate-800 p-1">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail Drawer Modal */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs p-0">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-slide-in">
            {/* Drawer Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  SUBMISSION DETAILS
                </span>
                <h3 className="text-base font-bold text-white mt-1">{activeSubmission.formTitle}</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {activeSubmission.id}</p>
              </div>
              <button
                onClick={() => setActiveSubmission(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Metadata Panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Enumerator</span>
                  <span className="font-semibold text-slate-800">{activeSubmission.enumeratorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Device ID</span>
                  <span className="font-mono text-slate-700">{activeSubmission.deviceId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted Date</span>
                  <span className="text-slate-700">{new Date(activeSubmission.submittedAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Form Version</span>
                  <span className="font-mono font-bold text-emerald-700">v{activeSubmission.versionNumber}.0</span>
                </div>
                {activeSubmission.geolocation && (
                  <div className="col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">GPS Coordinates</span>
                    <span className="font-mono text-emerald-800">
                      {activeSubmission.geolocation.latitude}°, {activeSubmission.geolocation.longitude}° (±{activeSubmission.geolocation.accuracy}m)
                    </span>
                  </div>
                )}
              </div>

              {/* Questionnaire Answers Display */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Respondent Answers
                </h4>

                <div className="space-y-3">
                  {Object.entries(activeSubmission.answers).map(([varName, val]) => {
                    const qObj = targetForm?.questions.find(q => q.name === varName);
                    const label = qObj ? qObj.label : varName;

                    return (
                      <div key={varName} className="border-b border-slate-100 pb-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">{label}</span>
                          <span className="font-mono text-[10px] text-slate-400">{varName}</span>
                        </div>
                        <div className="mt-1 font-bold text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-mono">
                          {val !== undefined && val !== null ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Supervisor Review Workflow */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Supervisor Quality Review
                </h4>

                {activeSubmission.review && (
                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Reviewed by {activeSubmission.review.reviewedBy}</span>
                      <span className="text-[10px] text-slate-400">{new Date(activeSubmission.review.reviewedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 italic">"{activeSubmission.review.comments}"</p>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-semibold text-slate-600">Review Decision</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewStatus('APPROVED')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 border transition-all ${
                        reviewStatus === 'APPROVED'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewStatus('FLAGGED')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 border transition-all ${
                        reviewStatus === 'FLAGGED'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Flag</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewStatus('REJECTED')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 border transition-all ${
                        reviewStatus === 'REJECTED'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mt-2 mb-1">Supervisor Notes / Audit Comment</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="e.g. Validated GPS fix and data spend."
                      className="w-full text-xs border rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                    />
                  </div>

                  <button
                    onClick={handleApplyReview}
                    disabled={isSubmittingReview}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors mt-2"
                  >
                    {isSubmittingReview ? 'Updating Audit Trail...' : 'Save Review Decision'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
