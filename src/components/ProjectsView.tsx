import React, { useState } from 'react';
import {
  Plus,
  FolderKanban,
  Users,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { Project, Form } from '../../shared/types';
import { createProject } from '../lib/api';

interface ProjectsViewProps {
  projects: Project[];
  forms: Form[];
  onRefresh: () => Promise<void>;
  onSelectProject: (projectId: string) => void;
  onOpenImport: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  forms,
  onRefresh,
  onSelectProject,
  onOpenImport
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await createProject({
        name,
        description,
        status: 'ACTIVE'
      });
      setName('');
      setDescription('');
      setIsCreateOpen(false);
      await onRefresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Research Projects & Surveys</h2>
          <p className="text-xs text-slate-500">
            Organize questionnaires, field teams, and datasets by research program.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenImport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Import Existing Questionnaire
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-700/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((p) => {
          const projectForms = forms.filter(f => f.projectId === p.id);
          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{p.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {p.description || 'Active research study with field enumerator data collection.'}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="block font-bold text-slate-900">{projectForms.length}</span>
                  <span className="text-[10px] text-slate-400">Forms</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="block font-bold text-slate-900">{p.enumeratorCount || 8}</span>
                  <span className="text-[10px] text-slate-400">Enumerators</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="block font-bold text-slate-900">{p.totalSubmissions || 24}</span>
                  <span className="text-[10px] text-slate-400">Submissions</span>
                </div>
              </div>

              {/* Forms in this Project */}
              {projectForms.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Associated Questionnaires:</span>
                  <div className="space-y-1">
                    {projectForms.map(f => (
                      <div key={f.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate">{f.title}</span>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          v{f.currentVersion}.0
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => onSelectProject(p.id)}
                className="w-full mt-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center"
              >
                Open Project & Questionnaires
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Create New Project</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 National Health & Agricultural Survey"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of research scope, target geolocations, and sample size."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {isSaving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
