import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  DownloadCloud,
  FileText,
  Play,
  RotateCw,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Inbox,
  Send,
  AlertTriangle,
  Database,
  Trash2
} from 'lucide-react';
import { Form, Submission, Deployment } from '../../shared/types';
import { offlineDb, OfflineDraft, SyncQueueItem } from '../lib/indexedDb';
import { syncSubmissions, fetchForms, fetchDeployments } from '../lib/api';
import { InterviewScreen } from './InterviewScreen';

interface CollectAppProps {
  currentUser: { id: string; name: string; deviceId?: string };
  isOfflineSimulated: boolean;
  onToggleOffline: () => void;
  onSyncStateChange?: (pendingCount: number) => void;
}

export const CollectApp: React.FC<CollectAppProps> = ({
  currentUser,
  isOfflineSimulated,
  onToggleOffline,
  onSyncStateChange
}) => {
  const [activeTab, setActiveTab] = useState<'downloaded' | 'assigned' | 'drafts' | 'submissions' | 'queue'>('downloaded');
  const [downloadedForms, setDownloadedForms] = useState<Form[]>([]);
  const [assignedForms, setAssignedForms] = useState<Form[]>([]);
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [localSubmissions, setLocalSubmissions] = useState<Submission[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Active Interview state
  const [activeInterviewForm, setActiveInterviewForm] = useState<Form | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined);
  const [activeDraftAnswers, setActiveDraftAnswers] = useState<Record<string, any>>({});

  const deviceId = currentUser.deviceId || 'DEV-CMRG-MOBILE-01';

  // Load IndexedDB contents
  const refreshLocalData = async () => {
    try {
      const forms = await offlineDb.getDownloadedForms();
      const localDrafts = await offlineDb.getDrafts();
      const subs = await offlineDb.getLocalSubmissions();
      const queue = await offlineDb.getPendingSyncItems();

      setDownloadedForms(forms);
      setDrafts(localDrafts);
      setLocalSubmissions(subs);
      setSyncQueue(queue);

      if (onSyncStateChange) {
        onSyncStateChange(queue.length);
      }
    } catch (e) {
      console.warn('Error reading from IndexedDB:', e);
    }
  };

  // Fetch online assignments if not in offline simulation
  const fetchAssigned = async () => {
    if (isOfflineSimulated) return;
    try {
      const allForms = await fetchForms();
      const published = allForms.filter(f => f.status === 'PUBLISHED');
      setAssignedForms(published);
    } catch (e) {
      console.warn('Could not fetch online forms:', e);
    }
  };

  useEffect(() => {
    refreshLocalData();
    fetchAssigned();
  }, [isOfflineSimulated]);

  // Attempt auto-sync when online and queue has items
  useEffect(() => {
    if (!isOfflineSimulated && syncQueue.length > 0 && !isSyncing) {
      triggerSync();
    }
  }, [isOfflineSimulated, syncQueue.length]);

  const handleDownloadForm = async (form: Form) => {
    await offlineDb.saveDownloadedForm(form);
    await refreshLocalData();
    setSyncNotice(`Downloaded "${form.title}" for 100% offline field use!`);
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const handleStartInterview = (form: Form) => {
    setActiveInterviewForm(form);
    setActiveDraftId(undefined);
    setActiveDraftAnswers({});
  };

  const handleResumeDraft = async (draft: OfflineDraft) => {
    const form = downloadedForms.find(f => f.id === draft.formId) || {
      id: draft.formId,
      projectId: 'proj_local',
      title: draft.formTitle,
      description: '',
      status: 'PUBLISHED',
      currentVersion: draft.versionNumber,
      questions: [],
      settings: { formTitle: draft.formTitle, formId: draft.formId, defaultLanguage: 'en', allowDrafts: true, requireGps: false },
      createdAt: '',
      updatedAt: ''
    };

    setActiveInterviewForm(form);
    setActiveDraftId(draft.localId);
    setActiveDraftAnswers(draft.answers);
  };

  const handleDeleteDraft = async (localId: string) => {
    await offlineDb.deleteDraft(localId);
    await refreshLocalData();
  };

  const handleSaveDraft = async (answers: Record<string, any>, draftId?: string) => {
    if (!activeInterviewForm) return;

    const localId = draftId || `draft_${Date.now()}`;
    const newDraft: OfflineDraft = {
      localId,
      formId: activeInterviewForm.id,
      formTitle: activeInterviewForm.title,
      formVersionId: activeInterviewForm.currentVersionId || 'v1',
      versionNumber: activeInterviewForm.currentVersion || 1,
      answers,
      updatedAt: new Date().toISOString(),
      enumeratorName: currentUser.name
    };

    await offlineDb.saveDraft(newDraft);
    await refreshLocalData();
    setActiveInterviewForm(null);
    setSyncNotice('Draft saved locally in IndexedDB.');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleSubmitComplete = async (submission: Submission, draftIdToDelete?: string) => {
    // 1. Save locally in IndexedDB submissions store & enqueue
    await offlineDb.saveLocalSubmission(submission);

    // 2. Remove draft if this interview was resumed from draft
    if (draftIdToDelete) {
      await offlineDb.deleteDraft(draftIdToDelete);
    }

    await refreshLocalData();
    setActiveInterviewForm(null);

    setSyncNotice('Interview completed! Stored safely in local IndexedDB.');

    // 3. If online, trigger immediate synchronization
    if (!isOfflineSimulated) {
      setTimeout(() => triggerSync(), 500);
    }
  };

  const triggerSync = async () => {
    if (isOfflineSimulated) {
      setSyncNotice('Cannot sync while offline mode is active. Reconnect network to sync.');
      setTimeout(() => setSyncNotice(null), 3500);
      return;
    }

    const pending = await offlineDb.getPendingSyncItems();
    if (pending.length === 0) {
      setSyncNotice('All records are already synchronized with CMRG Central.');
      setTimeout(() => setSyncNotice(null), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncNotice(`Synchronizing ${pending.length} submissions to CMRG Central...`);

    try {
      const submissionsToUpload = pending.map(p => p.submission);
      const res = await syncSubmissions(submissionsToUpload, deviceId, currentUser.id, currentUser.name);

      // Mark completed in IndexedDB
      for (const p of pending) {
        await offlineDb.markSyncComplete(p.id);
      }

      await refreshLocalData();
      setSyncNotice(`Sync Successful! Uploaded ${res.syncedCount} records (${res.duplicatesDetected} duplicate checks passed).`);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncNotice(`Sync failed: ${err.message || 'Server unreachable'}. Records remain safely stored locally.`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  // If in an active interview, render the Interview Screen
  if (activeInterviewForm) {
    return (
      <InterviewScreen
        form={activeInterviewForm}
        enumerator={{ id: currentUser.id, name: currentUser.name, deviceId }}
        initialAnswers={activeDraftAnswers}
        initialLocalId={activeDraftId}
        onSaveDraft={handleSaveDraft}
        onSubmitComplete={handleSubmitComplete}
        onCancel={() => setActiveInterviewForm(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Device Info & Status Bar */}
      <div className="bg-[#05070a] text-white rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FF2D20] flex items-center justify-center text-white shadow-lg shadow-red-900/40">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-white">CMRG Collect</h2>
              <span className="text-[11px] bg-[#FF2D20]/20 text-[#FF2D20] font-semibold px-2 py-0.5 rounded border border-[#FF2D20]/30">
                PWA / OFFLINE CLIENT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Enumerator: <span className="text-white font-medium">{currentUser.name}</span> • Device ID: <code className="font-mono text-[#FF2D20]">{deviceId}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Sync status indicator */}
          <button
            id="btn-collect-sync"
            onClick={triggerSync}
            disabled={isSyncing}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              syncQueue.length > 0
                ? 'bg-[#FF2D20] hover:bg-[#E0261A] text-white shadow-md shadow-red-600/30 animate-pulse'
                : 'bg-black/60 hover:bg-black text-slate-200 border border-white/15'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : syncQueue.length > 0 ? `Sync Queue (${syncQueue.length})` : 'Sync Engine'}</span>
          </button>

          {/* Offline field mode toggle */}
          <button
            onClick={onToggleOffline}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
              isOfflineSimulated
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/60'
                : 'bg-black/60 text-slate-300 border-white/15 hover:border-emerald-500/40'
            }`}
          >
            {isOfflineSimulated ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulating Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Online</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncNotice && (
        <div className="p-3.5 bg-black/80 border border-[#FF2D20]/40 rounded-xl text-xs text-white font-medium flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#FF2D20]" />
            <span>{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-[#FF2D20] hover:text-white text-[10px] font-bold">
            DISMISS
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-xs space-x-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('downloaded')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'downloaded' ? 'bg-[#FF2D20] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Downloaded Forms ({downloadedForms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'assigned' ? 'bg-[#FF2D20] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          <span>Available on Server ({assignedForms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'drafts' ? 'bg-[#FF2D20] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Drafts ({drafts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'submissions' ? 'bg-[#FF2D20] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Local Submissions ({localSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'queue' ? 'bg-[#FF2D20] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Sync Queue ({syncQueue.length})</span>
        </button>
      </div>

      {/* Tab 1: Downloaded Forms (100% Offline Ready) */}
      {activeTab === 'downloaded' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>These questionnaires are stored in browser IndexedDB and work with zero internet.</span>
          </div>

          {downloadedForms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No questionnaires downloaded yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Switch to the "Available on Server" tab to download assigned forms into local storage.
              </p>
              <button
                onClick={() => setActiveTab('assigned')}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"
              >
                Browse Server Forms
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {downloadedForms.map((f) => (
                <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight">{f.title}</h3>
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        OFFLINE READY
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{f.description || 'Standard CMRG Questionnaire'}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-3">
                      <span>{f.questions.length} questions</span>
                      <span>•</span>
                      <span>v{f.currentVersion}.0</span>
                    </div>
                  </div>

                  <button
                    id={`btn-start-interview-${f.id}`}
                    onClick={() => handleStartInterview(f)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-700/20 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Interview</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Available on Server */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Published questionnaires available on CMRG Central server:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedForms.map((f) => {
              const isDownloaded = downloadedForms.some(d => d.id === f.id);
              return (
                <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight">{f.title}</h3>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        v{f.currentVersion}.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{f.description || 'CMRG research questionnaire'}</p>
                    <div className="text-[11px] text-slate-400 mt-2">
                      <span>{f.questions.length} Questions</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadForm(f)}
                    className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors ${
                      isDownloaded
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-700/20'
                    }`}
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>{isDownloaded ? 'Re-Download Update' : 'Download for Offline Use'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Drafts */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold">No active in-progress drafts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((d) => (
                <div key={d.localId} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{d.formTitle}</h4>
                    <p className="text-[11px] text-slate-500">
                      Saved: {new Date(d.updatedAt).toLocaleTimeString()} • {Object.keys(d.answers).length} answers entered
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleResumeDraft(d)}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Resume</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(d.localId)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Local Submissions */}
      {activeTab === 'submissions' && (
        <div className="space-y-3">
          {localSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              <p className="text-xs font-semibold">No completed interviews stored locally yet</p>
            </div>
          ) : (
            localSubmissions.map((s) => (
              <div key={s.clientSubmissionId} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{s.formTitle}</h4>
                  <p className="text-[11px] text-slate-500">
                    UUID: <span className="font-mono">{s.clientSubmissionId.slice(0, 18)}...</span> • {new Date(s.submittedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                    s.syncStatus === 'SYNCED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {s.syncStatus}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 5: Sync Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Queued for CMRG Central Server Sync
                </h3>
                <p className="text-[11px] text-slate-500">
                  Submissions in this queue upload automatically when an active internet connection is detected.
                </p>
              </div>

              <button
                onClick={triggerSync}
                disabled={isSyncing || syncQueue.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Upload Now</span>
              </button>
            </div>

            {syncQueue.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span>Queue is clear! All local interviews are safely synced to the server.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {syncQueue.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.submission.formTitle}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        Idempotency Key: {item.id}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      PENDING UPLOAD
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
