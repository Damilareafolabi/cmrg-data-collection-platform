import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Play,
  UploadCloud,
  Save,
  Send,
  Layers,
  Sparkles,
  Shuffle,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
  Settings
  ,AlertTriangle
} from 'lucide-react';
import { Form, Question, QuestionType, ChoiceOption } from '../../shared/types';
import { FormTestRunner } from './FormTestRunner';

interface FormBuilderProps {
  initialForm: Form;
  onSave: (form: Form) => Promise<void>;
  onPublish: (formId: string, notes?: string) => Promise<void>;
  onOpenImportModal: () => void;
  onBack: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  initialForm,
  onSave,
  onPublish,
  onOpenImportModal,
  onBack
}) => {
  const [form, setForm] = useState<Form>(initialForm);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialForm.questions.length > 0 ? initialForm.questions[0].id : null
  );
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishNotes, setPublishNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [validationPassed, setValidationPassed] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('text');

  const selectedQuestion = form.questions.find(q => q.id === selectedQuestionId) || null;

  const updateSelectedQuestion = (updates: Partial<Question>) => {
    if (!selectedQuestionId) return;
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === selectedQuestionId ? { ...q, ...updates } : q)
    }));
  };

  const addSection = () => {
    const sectionNumber = form.questions.filter(q => q.type === 'begin_group').length + 1;
    const baseOrder = form.questions.length + 1;
    const groupId = `group_${Date.now()}`;
    const start: Question = {
      id: `${groupId}_start`,
      name: `section_${sectionNumber}`,
      label: `Section ${sectionNumber}`,
      type: 'begin_group',
      required: false,
      order: baseOrder,
      groupId,
      sectionTitle: `Section ${sectionNumber}`
    };
    const end: Question = {
      id: `${groupId}_end`,
      name: `section_${sectionNumber}_end`,
      label: `End Section ${sectionNumber}`,
      type: 'end_group',
      required: false,
      order: baseOrder + 1,
      groupId,
      sectionTitle: `Section ${sectionNumber}`
    };
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, start, end].map((question, index) => ({ ...question, order: index + 1 }))
    }));
    setSelectedQuestionId(start.id);
  };

  const validateForm = () => {
    const messages: string[] = [];
    if (!form.title.trim()) messages.push('Questionnaire title is required.');
    const names = new Set<string>();
    form.questions.forEach((question, index) => {
      if (!question.label.trim()) messages.push(`Question ${index + 1} is missing a label.`);
      if (!question.name.trim()) messages.push(`Question ${index + 1} is missing a variable name.`);
      if (names.has(question.name)) messages.push(`Duplicate variable name: ${question.name}.`);
      names.add(question.name);
      if (['select_one', 'select_multiple', 'dropdown', 'yes_no'].includes(question.type) &&
          (!question.choices || question.choices.length === 0)) {
        messages.push(`${question.label || question.name} needs at least one choice.`);
      }
    });
    setValidationMessages(messages);
    setValidationPassed(messages.length === 0);
    return messages;
  };

  const addQuestion = (type: QuestionType = 'text') => {
    const nextOrder = form.questions.length + 1;
    const newId = `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newName = `question_${nextOrder}`;

    const newQ: Question = {
      id: newId,
      name: newName,
      label: `New Question ${nextOrder}`,
      type,
      required: false,
      order: nextOrder,
      choices: ['select_one', 'select_multiple', 'dropdown', 'yes_no'].includes(type)
        ? type === 'yes_no'
          ? [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]
          : [
              { value: 'opt_1', label: 'Option 1' },
              { value: 'opt_2', label: 'Option 2' }
            ]
        : undefined
    };

    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQ]
    }));
    setSelectedQuestionId(newId);
  };

  const duplicateQuestion = (q: Question) => {
    const copyId = `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const copyName = `${q.name}_copy`;
    const copyQ: Question = {
      ...JSON.parse(JSON.stringify(q)),
      id: copyId,
      name: copyName,
      label: `${q.label} (Copy)`,
      order: form.questions.length + 1
    };

    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, copyQ]
    }));
    setSelectedQuestionId(copyId);
  };

  const deleteQuestion = (id: string) => {
    setForm(prev => {
      const filtered = prev.questions.filter(q => q.id !== id);
      return { ...prev, questions: filtered };
    });
    if (selectedQuestionId === id) {
      setSelectedQuestionId(form.questions[0]?.id || null);
    }
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= form.questions.length) return;

    const list = [...form.questions];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    // re-assign order
    list.forEach((item, i) => { item.order = i + 1; });

    setForm(prev => ({ ...prev, questions: list }));
  };

  const handleSaveForm = async () => {
    setIsSaving(true);
    try {
      await onSave(form);
      setSaveSuccessBanner(true);
      setTimeout(() => setSaveSuccessBanner(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmPublish = async () => {
    if (validateForm().length > 0) return;
    await onPublish(form.id, publishNotes);
    setIsPublishModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-100">
      {/* Top Action Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
          >
            ← Back to Forms
          </button>
          <button
            id="btn-add-section"
            onClick={addSection}
            className="p-1 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold text-xs flex items-center space-x-1 px-2"
            title="Add a section/group"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </button>
          <span className="text-slate-300">|</span>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1"
              />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                form.status === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {form.status} {form.currentVersion ? `v${form.currentVersion}.0` : 'Draft'}
              </span>
            </div>
            <p className="text-xs text-slate-400 pl-1">{form.questions.length} Questions in Questionnaire</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {saveSuccessBanner && (
            <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1 mr-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved</span>
            </span>
          )}

          <button
            id="btn-import-in-builder"
            onClick={onOpenImportModal}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
            <span>Import Sheet</span>
          </button>

          <button
            id="btn-validate-form"
            onClick={() => validateForm()}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Validate</span>
          </button>

          <button
            id="btn-test-form-builder"
            onClick={() => setIsTestModalOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Preview / Test</span>
          </button>

          <button
            id="btn-save-form"
            onClick={handleSaveForm}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            id="btn-open-publish-modal"
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-md shadow-emerald-700/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Builder Interface */}
      {validationMessages.length > 0 && (
        <div className="mx-6 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>{validationMessages.length} validation issue{validationMessages.length === 1 ? '' : 's'}</span>
          </div>
          <ul className="mt-1 list-disc pl-5">
            {validationMessages.map(message => <li key={message}>{message}</li>)}
          </ul>
        </div>
      )}
      {validationPassed && (
        <div className="mx-6 mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900">
          Questionnaire is valid and ready to save or publish.
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Question Outline / Reordering */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Outline ({form.questions.length})
            </span>
            <select
              aria-label="New question type"
              value={newQuestionType}
              onChange={(event) => setNewQuestionType(event.target.value as QuestionType)}
              className="max-w-[120px] p-1.5 border border-slate-300 rounded text-[10px] bg-white"
            >
              <option value="text">Text</option>
              <option value="integer">Number</option>
              <option value="decimal">Decimal</option>
              <option value="yes_no">Yes/No</option>
              <option value="select_one">Single Choice</option>
              <option value="select_multiple">Multiple Choice</option>
              <option value="dropdown">Dropdown</option>
              <option value="date">Date</option>
              <option value="time">Time</option>
              <option value="datetime">Date-Time</option>
              <option value="geopoint">GPS</option>
              <option value="image">Photo</option>
              <option value="audio">Audio</option>
            </select>
            <button
              id="btn-add-question"
              onClick={() => addQuestion(newQuestionType)}
              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center space-x-1 px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {form.questions.map((q, idx) => {
              const isSelected = q.id === selectedQuestionId;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">#{idx + 1}</span>
                    <div className="truncate">
                      <p className="font-semibold truncate">{q.label || 'Untitled Question'}</p>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>{q.name}</span>
                        <span>•</span>
                        <span className="text-emerald-700">{q.type}</span>
                        {q.required && <span className="text-red-500 font-bold">*</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-0.5 shrink-0 ml-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedQuestionId(q.id); }}
                      className="px-1.5 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 'up'); }}
                      disabled={idx === 0}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 'down'); }}
                      disabled={idx === form.questions.length - 1}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Question Properties Editor */}
        <div className="flex-1 bg-slate-50 overflow-y-auto p-6">
          {selectedQuestion ? (
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                    #{selectedQuestion.order}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Question Properties</h3>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => duplicateQuestion(selectedQuestion)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-medium flex items-center space-x-1"
                    title="Duplicate Question"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={() => deleteQuestion(selectedQuestion.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-medium flex items-center space-x-1"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Main Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Question Label / Text
                  </label>
                  <input
                    type="text"
                    value={selectedQuestion.label}
                    onChange={(e) => updateSelectedQuestion({ label: e.target.value })}
                    className="w-full text-sm font-medium border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Variable Name (Unique ID)
                    </label>
                    <input
                      type="text"
                      value={selectedQuestion.name}
                      onChange={(e) => updateSelectedQuestion({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Question Type
                    </label>
                    <select
                      value={selectedQuestion.type}
                      onChange={(e) => {
                        const newType = e.target.value as QuestionType;
                        updateSelectedQuestion({
                          type: newType,
                          choices: ['select_one', 'select_multiple', 'dropdown', 'yes_no'].includes(newType)
                            ? selectedQuestion.choices || [
                                { value: 'choice_1', label: 'Choice 1' },
                                { value: 'choice_2', label: 'Choice 2' }
                              ]
                            : undefined
                        });
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="text">Short text</option>
                      <option value="long_text">Long text / Paragraph</option>
                      <option value="note">Note / Instruction (No input)</option>
                      <option value="integer">Integer number</option>
                      <option value="decimal">Decimal number</option>
                      <option value="select_one">Single choice</option>
                      <option value="select_multiple">Multiple choice</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="yes_no">Yes / No</option>
                      <option value="rating">Rating (Stars / Scale)</option>
                      <option value="ranking">Ranking Order</option>
                      <option value="date">Date</option>
                      <option value="time">Time</option>
                      <option value="datetime">Date & Time</option>
                      <option value="calculate">Calculated Field</option>
                      <option value="geopoint">GPS Location</option>
                      <option value="image">Photo / Image</option>
                      <option value="audio">Audio Voice Note</option>
                      <option value="signature">Digital Signature</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hint / Enumerator Instruction
                  </label>
                  <input
                    type="text"
                    value={selectedQuestion.hint || ''}
                    onChange={(e) => updateSelectedQuestion({ hint: e.target.value })}
                    placeholder="e.g. Must be 18 years or older. Record in completed years."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Choices Config if choice-based */}
                {['select_one', 'select_multiple', 'dropdown', 'yes_no'].includes(selectedQuestion.type) && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Response Options
                      </span>
                      {selectedQuestion.type !== 'yes_no' && (
                        <button
                          onClick={() => {
                            const cur = selectedQuestion.choices || [];
                            const nextVal = `opt_${cur.length + 1}`;
                            updateSelectedQuestion({
                              choices: [...cur, { value: nextVal, label: `Option ${cur.length + 1}` }]
                            });
                          }}
                          className="text-xs text-emerald-700 font-bold hover:text-emerald-800 flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Option</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {selectedQuestion.choices?.map((c, cIdx) => (
                        <div key={cIdx} className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Value code (e.g. male)"
                            value={c.value}
                            onChange={(e) => {
                              const list = [...(selectedQuestion.choices || [])];
                              list[cIdx] = { ...list[cIdx], value: e.target.value };
                              updateSelectedQuestion({ choices: list });
                            }}
                            className="w-1/3 text-xs font-mono border rounded p-1.5 bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Display Label (e.g. Male)"
                            value={c.label}
                            onChange={(e) => {
                              const list = [...(selectedQuestion.choices || [])];
                              list[cIdx] = { ...list[cIdx], label: e.target.value };
                              updateSelectedQuestion({ choices: list });
                            }}
                            className="w-2/3 text-xs border rounded p-1.5 bg-white font-medium"
                          />
                          {selectedQuestion.type !== 'yes_no' && (
                            <button
                              onClick={() => {
                                const list = (selectedQuestion.choices || []).filter((_, i) => i !== cIdx);
                                updateSelectedQuestion({ choices: list });
                              }}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skip Logic (Relevance) */}
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70 space-y-2">
                  <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                    <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Skip Logic / Relevance Condition</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Only display this question when the condition evaluates to true. Example:{' '}
                    <code className="font-mono text-amber-800 bg-amber-100 px-1 py-0.2 rounded">${'{owns_phone}'} = 'yes'</code>
                  </p>
                  <input
                    type="text"
                    placeholder="${owns_phone} = 'yes'"
                    value={selectedQuestion.relevant || ''}
                    onChange={(e) => updateSelectedQuestion({ relevant: e.target.value })}
                    className="w-full text-xs font-mono border border-amber-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Validation Constraint */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/70 space-y-2">
                  <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Validation Constraint & Custom Error Message</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Rule using '.' for current value. Example:{' '}
                    <code className="font-mono text-blue-800 bg-blue-100 px-1 py-0.2 rounded">. {'>='} 0 and . {'<='} 120</code>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Constraint formula: . >= 0"
                      value={selectedQuestion.constraint || ''}
                      onChange={(e) => updateSelectedQuestion({ constraint: e.target.value })}
                      className="w-full text-xs font-mono border border-blue-300 rounded-lg p-2 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Custom error message when invalid"
                      value={selectedQuestion.constraintMessage || ''}
                      onChange={(e) => updateSelectedQuestion({ constraintMessage: e.target.value })}
                      className="w-full text-xs border border-blue-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>

                {/* Calculation */}
                {(selectedQuestion.type === 'calculate' || selectedQuestion.calculation) && (
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200/70 space-y-2">
                    <div className="flex items-center space-x-1.5 text-purple-900 font-bold text-xs">
                      <Calculator className="w-3.5 h-3.5 text-purple-600" />
                      <span>Calculation Formula</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Formula referencing other question variables. Example:{' '}
                      <code className="font-mono text-purple-800 bg-purple-100 px-1 py-0.2 rounded">${'{monthly_spend}'} * 12</code>
                    </p>
                    <input
                      type="text"
                      placeholder="${data_spend} * 12"
                      value={selectedQuestion.calculation || ''}
                      onChange={(e) => updateSelectedQuestion({ calculation: e.target.value })}
                      className="w-full text-xs font-mono border border-purple-300 rounded-lg p-2.5 bg-white"
                    />
                  </div>
                )}

                {/* Required Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedQuestion.required}
                      onChange={(e) => updateSelectedQuestion({ required: e.target.checked })}
                      className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 rounded"
                    />
                    <span>Mandatory Question (Response Required)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Select a question or click "+ Add" to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Form Test Runner Modal */}
      <FormTestRunner
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        formTitle={form.title}
        questions={form.questions}
      />

      {/* Publish Form Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Publish Form Version</h3>
            <p className="text-xs text-slate-500">
              Publishing creates an immutable version (v{(form.currentVersion || 0) + 1}.0) that will be immediately assignable to field enumerators.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Release Notes</label>
              <textarea
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                placeholder="e.g. Updated skip logic for mobile data and added household GPS fix."
                className="w-full text-xs border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-publish"
                onClick={handleConfirmPublish}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md"
              >
                Confirm & Publish Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
