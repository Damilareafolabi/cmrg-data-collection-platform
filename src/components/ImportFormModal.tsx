import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCode,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { importQuestionnaireFile } from '../lib/api';
import { FormImportResult } from '../../shared/types';

interface ImportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: FormImportResult) => void;
}

export const ImportFormModal: React.FC<ImportFormModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsDragging(false);
    setErrorMsg(null);
    setIsAnalyzing(true);
    setAnalysisStatus(`Detecting questionnaire format in "${file.name}"...`);

    try {
      await new Promise(r => setTimeout(r, 600)); // Smooth UX transition
      setAnalysisStatus('Parsing question types, choice lists, skip conditions and constraints...');

      const result = await importQuestionnaireFile(file);
      setAnalysisStatus(`${result.questionsCount} questions detected successfully!`);
      await new Promise(r => setTimeout(r, 400));

      setIsAnalyzing(false);
      onImportSuccess(result);
    } catch (err: any) {
      console.error('Import failed:', err);
      setIsAnalyzing(false);
      setErrorMsg(err.message || 'Failed to parse questionnaire. Please check file format.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Instant built-in sample generators for testing without external files
  const loadBuiltInSample = async (type: 'xlsform' | 'excel' | 'docx' | 'csv') => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisStatus(`Generating sample ${type.toUpperCase()} questionnaire...`);

    try {
      let file: File;
      if (type === 'xlsform') {
        // Built-in XLSForm CSV / simulated XLS
        const surveyCsv = `type,name,label,hint,required,relevant,constraint,constraint_message
integer,respondent_age,What is the age of the respondent?,Between 0 and 120,yes,,. >= 0 and . <= 120,Age must be 0-120
select_one gender_list,gender,Gender of Respondent,,yes,,,
yes_no,owns_phone,Do you own a mobile smartphone?,Personal or shared,yes,,,
select_one network_list,network_provider,Which primary telecom network do you use?,,yes,\${owns_phone} = 'yes',,
decimal,monthly_data_spend,Monthly mobile data expenditure in NGN,,yes,\${owns_phone} = 'yes',. >= 0,Cannot be negative
calculate,annual_projected_spend,Annual Projected Spend (NGN),,\${owns_phone} = 'yes',\${monthly_data_spend} * 12,,
geopoint,dwelling_gps,Capture Household GPS Coordinates,Walk outside to clear sky,no,,,
image,dwelling_photo,Photograph of primary dwelling,Ensure good lighting,no,,,
`;
        file = new File([surveyCsv], 'CMRG_Household_Baseline_XLSForm.csv', { type: 'text/csv' });
      } else if (type === 'excel') {
        const standardTableCsv = `No,Question,Type,Options,Instructions,Required,Skip
1,What is your age in years?,Number,,Completed years,Yes,
2,Respondent Gender,Single choice,Male; Female; Other; Prefer not to say,,Yes,
3,State of Origin,Dropdown,Lagos; Kano; Rivers; Oyo; Kaduna; Abuja; Edo,,Yes,
4,Do you own a mobile phone?,Yes/No,Yes; No,Device in working condition,Yes,
5,Which primary network do you use?,Single choice,MTN; Airtel; Glo; 9mobile,,Yes,If owns_phone = yes
6,Monthly airtime and data expenditure?,Number,,In Naira (NGN),Yes,If owns_phone = yes
7,GPS Household Location,GPS,,Record outdoors,No,
8,Respondent Photo,Photo,,Clear headshot,No,
`;
        file = new File([standardTableCsv], 'Standard_Excel_Survey_Questionnaire.csv', { type: 'text/csv' });
      } else {
        const textDoc = `CMRG NIGERIA RESEARCH QUESTIONNAIRE 2026
SECTION A: DEMOGRAPHICS
1. What is your age? [required]
Note: Must be 18 years or older
2. Gender of respondent:
[ ] Male
[ ] Female
[ ] Other
3. Do you currently own a mobile phone?
[ ] Yes
[ ] No
4. Which network do you use most frequently? [If owns_phone = Yes]
a) MTN
b) Airtel
c) Glo
d) 9mobile
5. Estimated monthly spend on data? [If owns_phone = Yes]
6. Verification signature of respondent:
`;
        file = new File([textDoc], 'Field_Questionnaire_Draft.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }

      await processFile(file);
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Existing Questionnaire</h2>
              <p className="text-xs text-slate-500">CMRG Auto-Detection & Intelligent Conversion Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag and Drop Box */}
          <div
            id="questionnaire-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.xlsform,.csv,.tsv,.json,.xml,.txt,.docx,.pdf"
              className="hidden"
            />

            {isAnalyzing ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">Analyzing questionnaire...</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">{analysisStatus}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    Drop your questionnaire here
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    or click to browse from your computer
                  </p>
                </div>
                <div className="inline-flex items-center space-x-1.5 bg-slate-200/70 text-slate-700 font-mono text-[11px] px-3 py-1 rounded-full">
                  <span>XLSX</span>
                  <span>•</span>
                  <span>XLS</span>
                  <span>•</span>
                  <span>CSV</span>
                  <span>•</span>
                  <span>DOCX</span>
                  <span>•</span>
                  <span>PDF</span>
                </div>
              </div>
            )}
          </div>

          {/* Explanation of intelligence */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>What CMRG analyzes automatically:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>XLSForm survey, choices & settings sheets</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Ordinary Excel tables (No, Question, Type)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Skip logic & conditional relevance</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Calculations, validation constraints & choices</span>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Samples */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Try instant test questionnaires:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-sample-xlsform"
                onClick={() => loadBuiltInSample('xlsform')}
                disabled={isAnalyzing}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all"
              >
                <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>XLSForm (.xlsx)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Multi-sheet ODK/SurveyCTO standard</p>
              </button>

              <button
                id="btn-sample-excel"
                onClick={() => loadBuiltInSample('excel')}
                disabled={isAnalyzing}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all"
              >
                <div className="flex items-center space-x-1.5 text-blue-700 font-bold text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Standard Excel</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Columnar questionnaire with options</p>
              </button>

              <button
                id="btn-sample-word"
                onClick={() => loadBuiltInSample('docx')}
                disabled={isAnalyzing}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all"
              >
                <div className="flex items-center space-x-1.5 text-purple-700 font-bold text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Word / Text Form</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Numbered sections & brackets</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Supported: XLSX, XLS, CSV, JSON, DOCX, PDF</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 font-medium text-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
