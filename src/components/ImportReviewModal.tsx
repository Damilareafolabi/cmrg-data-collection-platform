import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  ArrowRight,
  Edit3,
  Play,
  Layers,
  ListOrdered,
  Shuffle,
  Calculator,
  Save,
  Trash2,
  Check
} from 'lucide-react';
import { FormImportResult, Question, QuestionType } from '../../shared/types';

interface ImportReviewModalProps {
  importResult: FormImportResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAsForm: (title: string, questions: Question[]) => void;
  onOpenInBuilder: (title: string, questions: Question[]) => void;
  onTestForm: (title: string, questions: Question[]) => void;
}

export const ImportReviewModal: React.FC<ImportReviewModalProps> = ({
  importResult,
  isOpen,
  onClose,
  onSaveAsForm,
  onOpenInBuilder,
  onTestForm
}) => {
  const [formTitle, setFormTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedWarningIdx, setSelectedWarningIdx] = useState<number | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  React.useEffect(() => {
    if (importResult) {
      setFormTitle(importResult.detectedFormTitle || 'Imported Questionnaire');
      setQuestions(importResult.questions);
      setSelectedWarningIdx(null);
      setEditingQuestionId(null);
    }
  }, [importResult]);

  if (!isOpen || !importResult) return null;

  const warnings = importResult.warnings || [];
  const validationErrors = warnings.filter(w => w.severity === 'error');
  const mediaFields = Array.isArray(importResult.rawSummary?.mediaFields)
    ? importResult.rawSummary.mediaFields.length
    : questions.filter(q => ['image', 'audio', 'signature'].includes(q.type)).length;
  const gpsFields = Array.isArray(importResult.rawSummary?.gpsFields)
    ? importResult.rawSummary.gpsFields.length
    : questions.filter(q => q.type === 'geopoint').length;

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSaveDraft = () => {
    onSaveAsForm(formTitle, questions);
  };

  const handleProceedToBuilder = () => {
    onOpenInBuilder(formTitle, questions);
  };

  const handleTestNow = () => {
    onTestForm(formTitle, questions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Review Imported Form</h2>
              <p className="text-xs text-slate-300">
                Source: <span className="font-mono text-emerald-400">{importResult.fileName}</span> ({importResult.fileType})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Form Title input */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Form / Questionnaire Title
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Detection Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 leading-tight">
                  {questions.filter(q => !['begin_group', 'end_group'].includes(q.type)).length}
                </div>
                <div className="text-[11px] font-medium text-slate-500">Questions</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900 leading-tight">{gpsFields}</div>
                  <div className="text-[11px] font-medium text-slate-500">GPS Fields</div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900 leading-tight">{mediaFields}</div>
                  <div className="text-[11px] font-medium text-slate-500">Media Fields</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 leading-tight">
                  {importResult.sectionsCount || 1}
                </div>
                <div className="text-[11px] font-medium text-slate-500">Sections</div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <ListOrdered className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 leading-tight">
                  {importResult.choiceListsCount}
                </div>
                <div className="text-[11px] font-medium text-slate-500">Choice Lists</div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Shuffle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 leading-tight">
                  {importResult.skipConditionsCount}
                </div>
                <div className="text-[11px] font-medium text-slate-500">Skip Logics</div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 leading-tight">
                  {importResult.calculationsCount}
                </div>
                <div className="text-[11px] font-medium text-slate-500">Calculations</div>
              </div>
            </div>
          </div>

          {/* Warnings Panel if any */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Items Requiring Review ({warnings.length})</span>
              </div>
              <div className="space-y-1.5 text-xs text-amber-700">
                {warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start justify-between bg-amber-100/50 p-2 rounded border border-amber-200/60">
                    <div>
                      <span className="font-semibold text-amber-900">
                        {w.questionName ? `[${w.questionName}] ` : ''}
                      </span>
                      <span>{w.message}</span>
                      {w.suggestedFix && (
                        <p className="text-[11px] text-amber-800 mt-0.5 italic">Tip: {w.suggestedFix}</p>
                      )}

                      {validationErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-red-900">
                              Resolve {validationErrors.length} validation error{validationErrors.length === 1 ? '' : 's'} before creating a production form.
                            </p>
                            <p className="text-[11px] text-red-700 mt-1">
                              You can open the questionnaire in the builder to correct the flagged items. The original import remains available for review.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Questions List with Quick Edit */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Questionnaire Structure ({questions.length} Items)
              </span>
              <span className="text-xs text-slate-500">Click edit to modify variables or logic before saving</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {questions.map((q, idx) => {
                const isEditing = editingQuestionId === q.id;

                return (
                  <div key={q.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                    {isEditing ? (
                      <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Question Label</label>
                            <input
                              type="text"
                              value={q.label}
                              onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                              className="w-full text-xs border rounded p-1.5 bg-white font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Variable Name</label>
                            <input
                              type="text"
                              value={q.name}
                              onChange={(e) => updateQuestion(q.id, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                              className="w-full text-xs font-mono border rounded p-1.5 bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Type</label>
                            <select
                              value={q.type}
                              onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                              className="w-full text-xs border rounded p-1.5 bg-white"
                            >
                              <option value="text">Short text</option>
                              <option value="integer">Integer</option>
                              <option value="decimal">Decimal</option>
                              <option value="select_one">Single Choice</option>
                              <option value="select_multiple">Multiple Choice</option>
                              <option value="dropdown">Dropdown</option>
                              <option value="yes_no">Yes / No</option>
                              <option value="date">Date</option>
                              <option value="geopoint">GPS Location</option>
                              <option value="image">Photo</option>
                              <option value="audio">Audio</option>
                              <option value="signature">Signature</option>
                              <option value="calculate">Calculated</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Required</label>
                            <select
                              value={q.required ? 'yes' : 'no'}
                              onChange={(e) => updateQuestion(q.id, { required: e.target.value === 'yes' })}
                              className="w-full text-xs border rounded p-1.5 bg-white"
                            >
                              <option value="yes">Yes (Mandatory)</option>
                              <option value="no">No (Optional)</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Skip Logic (Relevant)</label>
                            <input
                              type="text"
                              placeholder="${variable} = 'yes'"
                              value={q.relevant || ''}
                              onChange={(e) => updateQuestion(q.id, { relevant: e.target.value })}
                              className="w-full text-xs font-mono border rounded p-1.5 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            onClick={() => setEditingQuestionId(null)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                            <span className="text-xs font-semibold text-slate-800">{q.label}</span>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {q.name}
                            </span>
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                              {q.type}
                            </span>
                            {q.required && (
                              <span className="text-[10px] bg-red-50 text-red-600 px-1 py-0.2 rounded font-bold">
                                REQUIRED
                              </span>
                            )}
                          </div>

                          {q.choices && q.choices.length > 0 && (
                            <div className="flex flex-wrap gap-1 text-[11px] text-slate-500 pl-6">
                              <span className="font-medium text-slate-400">Options:</span>
                              {q.choices.map((c, cIdx) => (
                                <span key={cIdx} className="bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                  {c.label}
                                </span>
                              ))}
                            </div>
                          )}

                          {q.relevant && (
                            <div className="text-[11px] text-amber-700 font-mono pl-6 flex items-center space-x-1">
                              <Shuffle className="w-3 h-3 text-amber-500" />
                              <span>Skip Logic: {q.relevant}</span>
                            </div>
                          )}

                          {q.calculation && (
                            <div className="text-[11px] text-purple-700 font-mono pl-6 flex items-center space-x-1">
                              <Calculator className="w-3 h-3 text-purple-500" />
                              <span>Calculation: {q.calculation}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setEditingQuestionId(q.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Edit question"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeQuestion(q.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Remove question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Footer: Seamless next steps */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            <button
              id="btn-test-imported-form"
              onClick={handleTestNow}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Form Logic</span>
            </button>

            <button
              id="btn-open-in-builder"
              onClick={handleProceedToBuilder}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit in Form Builder</span>
            </button>

            <button
              id="btn-save-imported-form"
              onClick={handleSaveDraft}
              disabled={validationErrors.length > 0}
              title={validationErrors.length > 0 ? 'Resolve validation errors before creating the form' : 'Create this questionnaire in CMRG Survey'}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-colors shadow-md shadow-emerald-700/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Create CMRG Form</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
