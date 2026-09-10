import React, { useState, useEffect } from 'react';
import {
  Play,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Calculator,
  Shuffle,
  ShieldCheck,
  Check,
  RefreshCw
} from 'lucide-react';
import { Question } from '../../shared/types';
import {
  evaluateRelevance,
  evaluateCalculation,
  validateQuestion,
  recalculateForm
} from '../../shared/formEngine';

interface FormTestRunnerProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  questions: Question[];
}

export const FormTestRunner: React.FC<FormTestRunnerProps> = ({
  isOpen,
  onClose,
  formTitle,
  questions
}) => {
  if (!isOpen) return null;

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ submitted: boolean; answers: Record<string, any> } | null>(null);

  // Initialize default values
  useEffect(() => {
    const initial: Record<string, any> = {};
    for (const q of questions) {
      if (q.defaultValue !== undefined) {
        initial[q.name] = q.defaultValue;
      }
    }
    setAnswers(recalculateForm(questions, initial));
    setErrors({});
    setTestResult(null);
  }, [questions]);

  const handleAnswerChange = (varName: string, value: any) => {
    const updated = { ...answers, [varName]: value };
    // Trigger dynamic recalculations
    const recomputed = recalculateForm(questions, updated);
    setAnswers(recomputed);

    // Clear error on change if valid
    const targetQ = questions.find(q => q.name === varName);
    if (targetQ) {
      const v = validateQuestion(targetQ, value, recomputed);
      setErrors(prev => {
        const next = { ...prev };
        if (v.valid) {
          delete next[varName];
        } else if (v.error) {
          next[varName] = v.error;
        }
        return next;
      });
    }
  };

  const handleRunValidation = () => {
    const newErrors: Record<string, string> = {};
    let hasFailures = false;

    for (const q of questions) {
      if (['begin_group', 'end_group', 'begin_repeat', 'end_repeat'].includes(q.type)) continue;

      const isRelevant = evaluateRelevance(q.relevant, answers);
      if (isRelevant) {
        const check = validateQuestion(q, answers[q.name], answers);
        if (!check.valid && check.error) {
          newErrors[q.name] = check.error;
          hasFailures = true;
        }
      }
    }

    setErrors(newErrors);

    if (!hasFailures) {
      setTestResult({
        submitted: true,
        answers: { ...answers }
      });
    } else {
      setTestResult(null);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setErrors({});
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Test Form Simulator</h2>
                <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  INTERACTIVE QA ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">{formTitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Reset test answers"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Execution Panel */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/60">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Test Mode Active:</strong> Dynamic skip conditions, calculations, and constraints execute in real time.
              </span>
            </div>
          </div>

          {/* Render Questions with live skip logic */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              if (['begin_group', 'end_group', 'begin_repeat', 'end_repeat'].includes(q.type)) {
                return null;
              }

              const isRelevant = evaluateRelevance(q.relevant, answers);
              const hasError = errors[q.name];
              const value = answers[q.name] ?? '';

              if (!isRelevant) {
                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg border border-dashed border-slate-300 bg-slate-100/50 text-slate-400 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <EyeOff className="w-4 h-4 text-slate-400" />
                      <span>
                        <strong>#{idx + 1} {q.label}</strong> (Hidden by skip logic: <code className="font-mono text-[11px]">{q.relevant}</code>)
                      </span>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">SKIPPED</span>
                  </div>
                );
              }

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl border p-4.5 shadow-sm transition-all ${
                    hasError ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                        <label className="text-sm font-bold text-slate-900">
                          {q.label}
                        </label>
                        {q.required && <span className="text-red-500 font-bold">*</span>}
                      </div>
                      {q.hint && <p className="text-xs text-slate-500">{q.hint}</p>}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {q.relevant && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-mono flex items-center space-x-1">
                          <Shuffle className="w-2.5 h-2.5" />
                          <span>Conditional</span>
                        </span>
                      )}
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {q.name}
                      </span>
                    </div>
                  </div>

                  {/* Input controls based on question type */}
                  <div className="mt-2.5">
                    {/* Select One or Yes/No */}
                    {(q.type === 'select_one' || q.type === 'yes_no') && q.choices && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.choices.map((c) => (
                          <label
                            key={c.value}
                            className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                              value === c.value
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                                : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.name}
                              value={c.value}
                              checked={value === c.value}
                              onChange={() => handleAnswerChange(q.name, c.value)}
                              className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span>{c.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Multiple Choice */}
                    {q.type === 'select_multiple' && q.choices && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.choices.map((c) => {
                          const currentArr = Array.isArray(value) ? value : [];
                          const checked = currentArr.includes(c.value);
                          return (
                            <label
                              key={c.value}
                              className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                                checked
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                                  : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const nextArr = e.target.checked
                                    ? [...currentArr, c.value]
                                    : currentArr.filter((x: string) => x !== c.value);
                                  handleAnswerChange(q.name, nextArr);
                                }}
                                className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 rounded"
                              />
                              <span>{c.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Dropdown */}
                    {q.type === 'dropdown' && q.choices && (
                      <select
                        value={value}
                        onChange={(e) => handleAnswerChange(q.name, e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="">-- Choose an option --</option>
                        {q.choices.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    )}

                    {/* Integer or Decimal */}
                    {(q.type === 'integer' || q.type === 'decimal') && (
                      <input
                        type="number"
                        step={q.type === 'decimal' ? '0.01' : '1'}
                        value={value}
                        onChange={(e) => handleAnswerChange(q.name, e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={q.constraint ? `e.g. valid range (${q.constraint})` : 'Enter numeric value'}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    )}

                    {/* Text */}
                    {q.type === 'text' && (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleAnswerChange(q.name, e.target.value)}
                        placeholder="Type response..."
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    )}

                    {/* Calculated field */}
                    {(q.type === 'calculate' || q.calculation) && (
                      <div className="flex items-center space-x-2 bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-xs text-purple-900">
                        <Calculator className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold">Calculated Value:</span>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                          {value !== '' && value !== undefined ? String(value) : '0'}
                        </span>
                        <span className="text-[10px] text-purple-600 font-mono">
                          ({q.calculation})
                        </span>
                      </div>
                    )}

                    {/* Geopoint simulation */}
                    {q.type === 'geopoint' && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(q.name, { lat: 6.5244, lng: 3.3792, accuracy: 5 })}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                        >
                          Simulate GPS Fix (6.5244° N, 3.3792° E)
                        </button>
                        {value && typeof value === 'object' && (
                          <span className="text-xs text-emerald-600 font-mono">
                            Fix captured: {value.lat}, {value.lng} (±{value.accuracy}m)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Photo/Audio/Signature mocks in test */}
                    {['image', 'audio', 'signature'].includes(q.type) && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                        <span>{q.type.toUpperCase()} capture ready for field enumerator</span>
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(q.name, `simulated_${q.type}_captured`)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium text-[11px]"
                        >
                          {value ? 'Captured ✓' : `Simulate ${q.type}`}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Validation Error Banner */}
                  {hasError && (
                    <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{hasError}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Test Validation Results */}
          {testResult && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All Constraints & Logic Passed! Simulated Output:</span>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                {JSON.stringify(testResult.answers, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {Object.keys(answers).length} active responses recorded
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Close Test
            </button>
            <button
              id="btn-validate-test-submission"
              onClick={handleRunValidation}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-md shadow-emerald-700/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Validate & Test Submit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
