import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  MapPin,
  Camera,
  Mic,
  PenTool,
  AlertCircle,
  Shuffle,
  Calculator,
  Plus,
  Trash2,
  Check,
  Radio,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Form, Question, Submission, GeoLocationData } from '../../shared/types';
import {
  evaluateRelevance,
  evaluateCalculation,
  validateQuestion,
  recalculateForm
} from '../../shared/formEngine';

interface InterviewScreenProps {
  form: Form;
  enumerator: { id: string; name: string; deviceId?: string };
  initialAnswers?: Record<string, any>;
  initialLocalId?: string;
  onSaveDraft: (answers: Record<string, any>, draftId?: string) => Promise<void>;
  onSubmitComplete: (submission: Submission, draftIdToDelete?: string) => Promise<void>;
  onCancel: () => void;
}

export const InterviewScreen: React.FC<InterviewScreenProps> = ({
  form,
  enumerator,
  initialAnswers = {},
  initialLocalId,
  onSaveDraft,
  onSubmitComplete,
  onCancel
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gpsData, setGpsData] = useState<GeoLocationData | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Digital Signature Canvas Ref
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Initialize
  useEffect(() => {
    const initialized = { ...answers };
    for (const q of form.questions) {
      if (initialized[q.name] === undefined && q.defaultValue !== undefined) {
        initialized[q.name] = q.defaultValue;
      }
    }
    setAnswers(recalculateForm(form.questions, initialized));
  }, [form]);

  const handleAnswerChange = (varName: string, value: any) => {
    const updated = { ...answers, [varName]: value };
    const recomputed = recalculateForm(form.questions, updated);
    setAnswers(recomputed);

    // Dynamic field validation check
    const targetQ = form.questions.find(q => q.name === varName);
    if (targetQ) {
      const v = validateQuestion(targetQ, value, recomputed);
      setErrors(prev => {
        const next = { ...prev };
        if (v.valid) delete next[varName];
        else if (v.error) next[varName] = v.error;
        return next;
      });
    }
  };

  const handleCaptureGps = () => {
    setIsGettingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: GeoLocationData = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy),
            altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : undefined,
            timestamp: new Date().toISOString()
          };
          setGpsData(loc);
          setIsGettingGps(false);
        },
        () => {
          // Fallback simulation coordinates for testing indoors or when permission denied
          const fallbackLoc: GeoLocationData = {
            latitude: 6.5244,
            longitude: 3.3792,
            accuracy: 5.2,
            timestamp: new Date().toISOString()
          };
          setGpsData(fallbackLoc);
          setIsGettingGps(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsData({
        latitude: 6.5244,
        longitude: 3.3792,
        accuracy: 8.0,
        timestamp: new Date().toISOString()
      });
      setIsGettingGps(false);
    }
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSaveDraftClick = async () => {
    await onSaveDraft(answers, initialLocalId);
  };

  const handleSubmitClick = async () => {
    // Validate all questions
    const newErrors: Record<string, string> = {};
    let hasError = false;

    for (const q of form.questions) {
      if (['begin_group', 'end_group', 'begin_repeat', 'end_repeat'].includes(q.type)) continue;

      const isRelevant = evaluateRelevance(q.relevant, answers);
      if (isRelevant) {
        const check = validateQuestion(q, answers[q.name], answers);
        if (!check.valid && check.error) {
          newErrors[q.name] = check.error;
          hasError = true;
        }
      }
    }

    setErrors(newErrors);

    if (hasError) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const clientSubId = initialLocalId && initialLocalId.startsWith('sub_')
        ? initialLocalId
        : `sub_client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newSubmission: Submission = {
        id: clientSubId,
        clientSubmissionId: clientSubId,
        projectId: form.projectId,
        projectName: form.projectName,
        formId: form.id,
        formTitle: form.title,
        formVersionId: form.currentVersionId || `ver_${form.id}_v1`,
        versionNumber: form.currentVersion || 1,
        enumeratorId: enumerator.id,
        enumeratorName: enumerator.name,
        deviceId: enumerator.deviceId || 'DEV-CMRG-LOCAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        status: 'COMPLETED',
        syncStatus: 'OFFLINE_SAVED',
        answers: { ...answers },
        geolocation: gpsData || undefined,
        attachments: photoPreview ? [
          {
            id: `att_${Date.now()}`,
            questionName: 'respondent_photo',
            fileName: 'respondent_photo.jpg',
            fileType: 'image/jpeg',
            fileSize: 1024,
            dataUrl: photoPreview,
            uploadedAt: new Date().toISOString()
          }
        ] : undefined
      };

      await onSubmitComplete(newSubmission, initialLocalId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between sticky top-18 z-30">
        <button
          onClick={onCancel}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Interview</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm font-extrabold text-slate-900 truncate max-w-xs">{form.title}</h2>
          <p className="text-[11px] text-slate-500">
            Enumerator: <span className="font-semibold text-slate-700">{enumerator.name}</span>
          </p>
        </div>

        <button
          id="btn-save-interview-draft"
          onClick={handleSaveDraftClick}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Draft</span>
        </button>
      </div>

      {/* Error Summary Banner if any validation failed */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Please complete {Object.keys(errors).length} required or invalid fields before submitting.</span>
          </div>
        </div>
      )}

      {/* Form Questions Container */}
      <div className="space-y-4">
        {form.questions.map((q, idx) => {
          if (['begin_group', 'end_group', 'begin_repeat', 'end_repeat'].includes(q.type)) {
            return null;
          }

          const isRelevant = evaluateRelevance(q.relevant, answers);
          if (!isRelevant) return null; // Dynamic Skip Logic applied

          const hasError = errors[q.name];
          const val = answers[q.name] ?? '';

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                hasError ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'
              }`}
            >
              <div className="space-y-1 mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                    <label className="text-sm font-bold text-slate-900 leading-snug">
                      {q.label}
                    </label>
                    {q.required && <span className="text-red-500 font-bold">*</span>}
                  </div>
                </div>
                {q.hint && <p className="text-xs text-slate-500">{q.hint}</p>}
              </div>

              {/* Controls */}
              <div className="mt-2">
                {/* Single Choice / Yes-No */}
                {(q.type === 'select_one' || q.type === 'yes_no') && q.choices && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.choices.map((c) => (
                      <label
                        key={c.value}
                        className={`flex items-center space-x-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          val === c.value
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.name}
                          value={c.value}
                          checked={val === c.value}
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
                      const curArr = Array.isArray(val) ? val : [];
                      const checked = curArr.includes(c.value);
                      return (
                        <label
                          key={c.value}
                          className={`flex items-center space-x-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            checked
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const nextArr = e.target.checked
                                ? [...curArr, c.value]
                                : curArr.filter((x: string) => x !== c.value);
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
                    value={val}
                    onChange={(e) => handleAnswerChange(q.name, e.target.value)}
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Tap to Select --</option>
                    {q.choices.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                )}

                {/* Number / Decimal */}
                {(q.type === 'integer' || q.type === 'decimal') && (
                  <input
                    type="number"
                    step={q.type === 'decimal' ? '0.01' : '1'}
                    value={val}
                    onChange={(e) => handleAnswerChange(q.name, e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Enter number..."
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                )}

                {/* Short text */}
                {q.type === 'text' && (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleAnswerChange(q.name, e.target.value)}
                    placeholder="Enter respondent answer..."
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                )}

                {/* Calculated Field */}
                {(q.type === 'calculate' || q.calculation) && (
                  <div className="flex items-center space-x-2.5 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900">
                    <Calculator className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="font-semibold">Auto-Computed:</span>
                    <span className="font-mono font-bold text-sm bg-white px-2.5 py-0.5 rounded-md border border-purple-300">
                      {val !== '' && val !== undefined ? String(val) : '0'}
                    </span>
                  </div>
                )}

                {/* GPS Location Capture */}
                {q.type === 'geopoint' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCaptureGps}
                      disabled={isGettingGps}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors border border-slate-200"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>{isGettingGps ? 'Fixing Satellite Coordinates...' : gpsData ? 'Re-capture GPS Fix' : 'Record GPS Coordinates'}</span>
                    </button>

                    {gpsData && (
                      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 font-mono flex items-center justify-between">
                        <span>Lat: {gpsData.latitude}°, Lng: {gpsData.longitude}° (±{gpsData.accuracy}m)</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">FIX ACQUIRED</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo Capture */}
                {q.type === 'image' && (
                  <div className="space-y-2">
                    <label className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors border border-slate-200 cursor-pointer">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>{photoPreview ? 'Change Photo' : 'Take / Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const url = re.target?.result as string;
                              setPhotoPreview(url);
                              handleAnswerChange(q.name, 'photo_captured.jpg');
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {photoPreview && (
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-300 mx-auto">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {/* Audio Verification */}
                {q.type === 'audio' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                        <Mic className="w-4 h-4 text-red-500" />
                        <span>Voice Verification Note</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const recordedName = `voice_note_${Date.now()}.wav`;
                          setAudioNote(recordedName);
                          handleAnswerChange(q.name, recordedName);
                        }}
                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs"
                      >
                        {audioNote ? 'Recorded ✓' : 'Simulate 10s Record'}
                      </button>
                    </div>
                    {audioNote && (
                      <p className="text-[11px] text-emerald-700 font-mono">Audio clip saved: {audioNote}</p>
                    )}
                  </div>
                )}

                {/* Digital Signature */}
                {q.type === 'signature' && (
                  <div className="space-y-2">
                    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
                      <canvas
                        ref={signatureCanvasRef}
                        width={400}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-28 cursor-crosshair touch-none"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Sign with finger or stylus</span>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-slate-500 hover:text-red-600 font-medium flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Validation error message */}
              {hasError && (
                <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{hasError}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-center">
        <p className="text-xs text-slate-500">
          Ready to save interview? Submissions are stored locally in IndexedDB and synchronized as soon as internet connection is present.
        </p>
        <button
          id="btn-complete-and-submit-interview"
          onClick={handleSubmitClick}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{isSubmitting ? 'Submitting Locally...' : 'Complete & Save Interview'}</span>
        </button>
      </div>
    </div>
  );
};
