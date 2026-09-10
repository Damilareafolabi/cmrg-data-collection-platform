import React, { useState } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Plus,
  Play,
  Edit3,
  Send,
  Trash2,
  Copy,
  Layers,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Form, Project } from '../../shared/types';
import { FormTestRunner } from './FormTestRunner';

interface FormsViewProps {
  forms: Form[];
  projects: Project[];
  selectedProjectId?: string | null;
  onOpenImport: () => void;
  onCreateNewForm: () => void;
  onSelectFormForEdit: (form: Form) => void;
  onDeleteForm: (formId: string) => Promise<void>;
  onDeployForm: (form: Form) => Promise<void>;
}

export const FormsView: React.FC<FormsViewProps> = ({
  forms,
  projects,
  selectedProjectId,
  onOpenImport,
  onCreateNewForm,
  onSelectFormForEdit,
  onDeleteForm,
  onDeployForm
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [testingForm, setTestingForm] = useState<Form | null>(null);
  const selectedProject = projects.find(project => project.id === selectedProjectId);

  const projectForms = selectedProjectId
    ? forms.filter(form => form.projectId === selectedProjectId)
    : forms;
  const filteredForms = projectForms.filter(f =>
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Prominent Import Questionnaire Banner (as explicitly requested) */}
      <div className="bg-[#0b1019] rounded-2xl p-6 text-white shadow-xl border border-white/10 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 max-w-xl relative z-10">
          <div className="inline-flex items-center space-x-2 bg-black/60 text-[#FF2D20] px-3 py-1 rounded-lg text-[11px] font-bold border border-[#FF2D20]/30">
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-[#FF2D20] rounded-[1px]" />
              <span className="w-1.5 h-1.5 bg-[#FF2D20] rounded-[1px]" />
            </div>
            <span>Zero Rebuilding Required</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
            Have an existing XLSForm, SurveyCTO, or Excel questionnaire?
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Never rebuild questions or skip conditions by hand. Drop your .xlsx, .xls, CSV, or questionnaire document into CMRG and our parser creates a production-ready form instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            id="btn-prominent-import-form"
            onClick={onOpenImport}
            className="px-5 py-3 bg-[#FF2D20] hover:bg-[#E0261A] text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>            Import Existing Questionnaire</span>
          </button>

          <button
            id="btn-create-blank-form"
            onClick={onCreateNewForm}
            className="px-4 py-3 bg-black/70 hover:bg-black text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 border border-white/20 hover:border-[#FF2D20] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF2D20]" />
            <span>Create New Questionnaire</span>
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Questionnaires</h1>
          <p className="text-xs text-slate-500">
            {selectedProject ? `Project: ${selectedProject.name}` : 'Create, import, edit, preview, validate, and publish questionnaires.'}
          </p>
        </div>
        {selectedProject && (
          <button onClick={() => onCreateNewForm()} className="text-xs font-bold text-emerald-700 hover:text-emerald-900">
            Create New Questionnaire
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search questionnaires by title or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredForms.length} of {forms.length} Questionnaires
        </div>
      </div>

      {/* Forms Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredForms.map((form) => (
          <div
            key={form.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  form.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {form.status} {form.currentVersion ? `v${form.currentVersion}.0` : 'Draft'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {form.questions.length} questions
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                {form.title}
              </h3>

              <p className="text-xs text-slate-500 line-clamp-2">
                {form.description || 'Nationwide household survey with conditional skip logic and GPS validation.'}
              </p>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100">
                <span>Updated: {new Date(form.updatedAt).toLocaleDateString()}</span>
                <span className="font-mono text-[10px] text-slate-400">{form.id}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <button
                id={`btn-edit-form-${form.id}`}
                onClick={() => onSelectFormForEdit(form)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Builder</span>
              </button>

              <button
                id={`btn-test-form-${form.id}`}
                onClick={() => setTestingForm(form)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1 transition-colors"
                title="Interactive Test Runner"
              >
                <Play className="w-3.5 h-3.5 text-slate-600" />
                <span>Test</span>
              </button>

              <button
                id={`btn-deploy-form-${form.id}`}
                onClick={() => onDeployForm(form)}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl flex items-center space-x-1 transition-colors"
                title="Deploy to field enumerators"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deploy</span>
              </button>

              <button
                onClick={() => onDeleteForm(form.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete form"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Form Test Runner Modal */}
      {testingForm && (
        <FormTestRunner
          isOpen={true}
          onClose={() => setTestingForm(null)}
          formTitle={testingForm.title}
          questions={testingForm.questions}
        />
      )}
    </div>
  );
};
