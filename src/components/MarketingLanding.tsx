import React, { useState } from 'react';
import {
  Smartphone,
  UploadCloud,
  FileSpreadsheet,
  Database,
  WifiOff,
  ShieldCheck,
  Zap,
  ArrowRight,
  BarChart3,
  Layers,
  CheckCircle2,
  Lock,
  Globe2,
  Users,
  Search,
  Check,
  MapPin,
  Camera,
  PenTool,
  GitBranch,
  FileCheck,
  Compass,
  Radio,
  Sliders,
  Sparkles,
  Download,
  Terminal,
  Activity,
  UserCheck,
  Monitor,
  BrainCircuit,
  Link2,
  Tablet,
  Eye,
  HelpCircle,
  X,
  ExternalLink,
  ListOrdered,
  Network,
  ChevronRight
} from 'lucide-react';
import { CMRGLogo } from './CMRGLogo';

interface MarketingLandingProps {
  onLaunchApp: (targetView?: string) => void;
  onOpenImport: () => void;
}

export const MarketingLanding: React.FC<MarketingLandingProps> = ({
  onLaunchApp,
  onOpenImport
}) => {
  const [activeUiTab, setActiveUiTab] = useState<'console' | 'builder' | 'submissions' | 'mobile'>('console');

  const [selectedFeatureItem, setSelectedFeatureItem] = useState<{
    title: string;
    tagline: string;
    description: string;
    category: 'Product' | 'Feature';
    capabilities: string[];
    actionText: string;
    targetView: string;
  } | null>(null);

  const productSuite = [
    {
      id: 'prod_overview',
      title: 'Product Overview',
      tagline: 'Get an overview of our data collection platform',
      category: 'Product' as const,
      description: 'CMRG Survey is a unified, self-hosted field research system engineered for high-assurance data collection, monitoring, and analysis without recurring vendor fees.',
      capabilities: [
        'Private On-Premises or VPS Hosting (Zero cloud fees)',
        'Enterprise Role-Based Access Control (Admin, Supervisor, Enumerator)',
        'Full Data Sovereignty & Confidentiality for CMRG Clients',
        'Direct PostgreSQL 16 relational database persistence'
      ],
      actionText: 'Explore Dashboard',
      targetView: 'dashboard'
    },
    {
      id: 'prod_how_it_works',
      title: 'How It Works',
      tagline: 'Understand the core components of CMRG Survey',
      category: 'Product' as const,
      description: 'A seamless 5-step operational workflow: Design questionnaires, deploy to field devices, collect 100% offline, sync idempotently, and export clean research datasets.',
      capabilities: [
        '1. Design: Web Questionnaire Builder + native XLSForm / Excel import',
        '2. Deploy: Instant rollout to field fleets with locked versions',
        '3. Collect: 100% offline capture on CMRG Collect Android phones',
        '4. Monitor: Live supervisor approval, GPS audits, and duration metrics',
        '5. Export: Clean data output to Stata, SPSS, R, CSV, and Excel'
      ],
      actionText: 'View Questionnaires',
      targetView: 'forms'
    },
    {
      id: 'prod_integrations',
      title: 'Integrations',
      tagline: 'Explore our integration options',
      category: 'Product' as const,
      description: 'Connect CMRG Survey directly to enterprise databases, statistical analysis pipelines, and automated reporting dashboards.',
      capabilities: [
        'Native PostgreSQL 16 & SQLite database connections',
        'RESTful API with SimpleJWT authentication and webhooks',
        'XLSForm (.xlsx) bidirectional schema compatibility',
        'Automated Power BI and Tableau live data feeds'
      ],
      actionText: 'Manage Projects',
      targetView: 'projects'
    }
  ];

  const featuresSuite = [
    {
      id: 'feat_overview',
      title: 'Features Overview',
      tagline: 'Learn more about key features and functionality',
      category: 'Feature' as const,
      description: 'End-to-end survey lifecycle coverage from question skip logic and constraint calculation to real-time enumerator GPS telemetry.',
      capabilities: [
        'Over 20+ validated question types (GPS, Audio, Photo, Ranking)',
        'Dynamic skip logic and mathematical constraint calculations',
        'Real-time supervisor approval and flagging workflows',
        'Automated speeder detection and interview duration checks'
      ],
      actionText: 'Open Form Builder',
      targetView: 'builder'
    },
    {
      id: 'feat_data_quality',
      title: 'Data Quality Tools',
      tagline: 'Ensure good data throughout the entire collection lifecycle',
      category: 'Feature' as const,
      description: 'Automated real-time and post-collection validation tools to detect interviewer fraud, outlier values, speeders, and geographic anomalies before data enters analysis.',
      capabilities: [
        'Automated interview duration and speeder detection flags',
        'Passive background audio audit snippets during interviews',
        'GPS geofencing and cluster distance verification',
        'Supervisor review console with Approve / Flag / Reject actions'
      ],
      actionText: 'Review Submissions',
      targetView: 'submissions'
    },
    {
      id: 'feat_offline',
      title: 'Advanced Offline',
      tagline: 'Complete offline functionality for data collection anytime, anywhere',
      category: 'Feature' as const,
      description: 'Engineered specifically for remote and rural fieldwork across Nigeria and West Africa with zero cell coverage. Enumerators can conduct multi-hour interviews without network.',
      capabilities: [
        '100% offline execution without active internet connection',
        'Robust local SQLite and IndexedDB transactional persistence',
        'Battery-conscious GPS location caching',
        'Offline photo and audio file queuing on device storage'
      ],
      actionText: 'Launch CMRG Collect',
      targetView: 'collect'
    },
    {
      id: 'feat_datasets',
      title: 'Datasets',
      tagline: 'Connect forms and systems for integrated data workflows',
      category: 'Feature' as const,
      description: 'Pre-load external datasets (lookup tables, census registries, healthcare facility rosters) directly into questionnaires for instant offline autocomplete.',
      capabilities: [
        'Pre-loaded CSV and JSON lookup tables for instant search',
        'Cascading geographic dropdowns (State -> LGA -> Ward -> Settlement)',
        'Cross-form longitudinal respondent linking',
        'Automated standardized codebook mapping'
      ],
      actionText: 'View Forms & Datasets',
      targetView: 'forms'
    },
    {
      id: 'feat_ai',
      title: 'AI at CMRG Survey',
      tagline: 'Use AI-powered tools to improve survey design',
      category: 'Feature' as const,
      description: 'Leverage built-in AI assistance to optimize question phrasing, auto-generate skip logic rules, and verify XLSForm syntax before deployment.',
      capabilities: [
        'Automated questionnaire syntax and constraint verification',
        'Leading question and response bias detection',
        'Automated codebook and variable dictionary generation',
        'Smart skip logic and relevance formula suggestions'
      ],
      actionText: 'Try AI Form Assistant',
      targetView: 'builder'
    },
    {
      id: 'feat_mobile_app',
      title: 'Mobile Survey App',
      tagline: 'Collect high-quality data with our mobile-ready app',
      category: 'Feature' as const,
      description: 'CMRG Collect is built on Flutter 3.22, compiling to standalone Android APKs that install on any field smartphone or tablet without Google Play dependencies.',
      capabilities: [
        'Native Flutter 3.22 high-performance mobile application',
        'Compatible with Android 7.0 through Android 14+',
        'Single-touch QR code and server token pairing',
        'Idempotent background batch synchronization engine'
      ],
      actionText: 'Launch Mobile Emulator',
      targetView: 'collect'
    },
    {
      id: 'feat_case_mgmt',
      title: 'Case Management',
      tagline: 'Manage longitudinal data collection and assign cases for follow up',
      category: 'Feature' as const,
      description: 'Track panels, recurring household visits, and facilities across multiple rounds of data collection with automated case assignment and revisit histories.',
      capabilities: [
        'Longitudinal panel and household revisit tracking',
        'Pre-loaded baseline rosters with dynamic respondent lookup',
        'Supervisor case re-assignment to alternate enumerators',
        'Multi-round survey status and completion tracking'
      ],
      actionText: 'Explore Projects',
      targetView: 'projects'
    },
    {
      id: 'feat_security',
      title: 'Survey Security',
      tagline: 'Protect your data with enterprise-grade security at every step',
      category: 'Feature' as const,
      description: 'Enterprise-grade data protection throughout the survey lifecycle: salted PBKDF2/Argon2 hashing, encrypted mobile storage, role-based access, and immutable audit logs.',
      capabilities: [
        'PBKDF2-SHA512 (100,000 rounds) & Argon2 password protection',
        'AES-256 field data encryption on mobile device storage',
        'Strict role-based access control (Admin, Supervisor, Enumerator)',
        'Immutable server audit logging for all exports and reviews'
      ],
      actionText: 'Open Security Console',
      targetView: 'welcome'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 selection:bg-[#FF2D20] selection:text-white font-sans">
      {/* Top Banner */}
      <div className="bg-[#05070a] border-b border-white/10 text-slate-300 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#FF2D20] animate-ping" />
            <span className="font-semibold text-white">CMRG Survey</span>
            <span className="text-slate-400">• Professional Research Data Collection Platform</span>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-[11px] text-slate-400">
            <span>RC378525</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono font-semibold">100% OFFLINE-FIRST FIELD ENGINE</span>
          </div>
        </div>
      </div>

      {/* ==================== 1. DATA COLLECTION HERO BANNER (BLACK BACKGROUND) ==================== */}
      <section className="relative overflow-hidden bg-black text-white py-16 px-6 sm:px-12 border-b border-white/15 shadow-2xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headlines & Callout */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#38bdf8] tracking-tight leading-tight">
                Data collection software built to work wherever you do
              </h1>
              <p className="text-base sm:text-lg text-slate-100 font-normal leading-relaxed">
                Capturing high-quality data is only the beginning. Build custom workflows, coordinate survey operations across global teams, and reach respondents anywhere.
              </p>
            </div>

            {/* User Requested Required Block */}
            <div className="p-5 rounded-xl bg-[#0b101b] border border-white/15 space-y-2">
              <div className="flex items-center space-x-2 text-[#38bdf8] text-xs font-bold font-mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CMRG Research Engine</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Powering smarter field research for CMRG.
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                CMRG Survey provides questionnaire design, field data collection, offline capability, synchronization, monitoring, and exports. Designed for rigorous FMCG, financial, healthcare, and socioeconomic research fieldwork.
              </p>
            </div>

            {/* Action Buttons & Features Checklist */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="btn-hero-teal-get-started"
                  onClick={() => onLaunchApp('welcome')}
                  className="px-7 py-3.5 bg-[#5da326] hover:bg-[#4e8d1e] text-white font-bold text-base rounded-lg shadow-lg shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer"
                >
                  <span>GET STARTED</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="btn-hero-teal-sign-in"
                  onClick={() => onLaunchApp('welcome')}
                  className="px-6 py-3.5 bg-black/60 hover:bg-black text-white font-semibold text-sm rounded-lg border border-white/20 hover:border-white/40 transition-colors cursor-pointer"
                >
                  <span>Sign In to Server</span>
                </button>
              </div>

              {/* Sub Checkmarks matching image */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-100 font-medium pt-1">
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>15-day free trial</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>10 forms</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>200MB storage</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>200 submissions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Device Showcase Mockup (Laptop + Phone + Tablet) */}
          <div className="lg:col-span-6 relative flex items-center justify-center pt-6 lg:pt-0">
            <div className="relative w-full max-w-xl">
              
              {/* 1. Center: Laptop Screen (Data Explorer - Monitor) */}
              <div className="relative z-10 bg-slate-900 rounded-t-xl border border-slate-600 shadow-2xl p-2 pb-0">
                <div className="bg-slate-100 text-slate-800 rounded-t-lg p-3 text-xs space-y-2">
                  
                  {/* Laptop Header Bar */}
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 text-[10px]">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">CMRG Data Explorer - Monitor</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-500 font-sans text-[9px]">
                      <span className="hover:underline cursor-pointer">Search</span>
                      <span>•</span>
                      <span className="hover:underline cursor-pointer">Save</span>
                      <span>•</span>
                      <span className="hover:underline cursor-pointer">Download</span>
                      <span>•</span>
                      <span className="hover:underline cursor-pointer">Close</span>
                    </div>
                  </div>

                  {/* Title & Survey Name */}
                  <div className="text-[11px] font-bold text-slate-800">
                    Household listing - round 2
                  </div>

                  {/* Status Metric Badges */}
                  <div className="grid grid-cols-4 gap-1 text-[9px] bg-slate-200/80 p-1.5 rounded text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900">SUBMISSIONS:</span> 173
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">FIELDS:</span> 17
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">DURATION:</span> 31:35s
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700">CHECKS:</span> 0 warnings
                    </div>
                  </div>

                  {/* Sample Data Table */}
                  <div className="bg-white rounded border border-slate-200 overflow-hidden text-[9px]">
                    <div className="grid grid-cols-4 bg-slate-100 p-1 font-bold text-slate-600 border-b border-slate-200">
                      <span>gps_location</span>
                      <span>enumerator</span>
                      <span>hh_head</span>
                      <span>status</span>
                    </div>
                    <div className="p-1 space-y-1 font-mono text-[8px] text-slate-600">
                      <div className="grid grid-cols-4 items-center">
                        <span className="text-blue-600">6.5244, 3.3792</span>
                        <span>Tunde A.</span>
                        <span>Alhaji Babangida</span>
                        <span className="text-emerald-600 font-bold">APPROVED</span>
                      </div>
                      <div className="grid grid-cols-4 items-center bg-slate-50">
                        <span className="text-blue-600">9.0765, 7.3986</span>
                        <span>Fatima Y.</span>
                        <span>Grace Okon</span>
                        <span className="text-emerald-600 font-bold">APPROVED</span>
                      </div>
                      <div className="grid grid-cols-4 items-center">
                        <span className="text-blue-600">12.0022, 8.5920</span>
                        <span>Chinedu O.</span>
                        <span>Musa Danjuma</span>
                        <span className="text-amber-600 font-bold">REVIEW</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laptop Base Stand */}
                <div className="h-2.5 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 rounded-b-md w-full" />
                <div className="h-1 bg-slate-500 w-1/3 mx-auto rounded-b" />
              </div>

              {/* 2. Front Left: Standing Android Smartphone (GPS Satellite Map) */}
              <div className="absolute -bottom-4 -left-4 sm:-left-8 z-20 w-36 sm:w-44 bg-slate-950 rounded-2xl border-2 border-slate-500 shadow-2xl p-1.5 shadow-black/90">
                <div className="h-1.5 w-10 bg-slate-700 mx-auto rounded-full mb-1" />
                <div className="bg-[#0b1f14] rounded-xl p-2 text-white h-44 flex flex-col justify-between relative overflow-hidden border border-emerald-500/30">
                  {/* Satellite Map Simulation */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 opacity-90" />
                  
                  {/* Grid Lines representing terrain */}
                  <div className="absolute inset-0 cmrg-pattern-grid opacity-30" />

                  {/* Top Bar */}
                  <div className="relative z-10 flex items-center justify-between text-[8px] font-mono text-emerald-300 bg-black/60 px-1.5 py-0.5 rounded">
                    <span>GPS AUDIT</span>
                    <span className="text-emerald-400">±3.2m</span>
                  </div>

                  {/* Pulsing Location Pin */}
                  <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center animate-ping absolute" />
                    <MapPin className="w-6 h-6 text-red-500 drop-shadow-md z-10" />
                    <span className="text-[8px] font-mono font-bold bg-black/80 px-1 rounded text-white mt-1">
                      6.5244° N, 3.3792° E
                    </span>
                  </div>

                  {/* Bottom Bar */}
                  <div className="relative z-10 text-[8px] text-center bg-black/70 py-0.5 rounded text-slate-200">
                    Location Recorded
                  </div>
                </div>
                <div className="w-8 h-1 bg-slate-700 mx-auto rounded-full mt-1" />
              </div>

              {/* 3. Front Right: Angled Tablet (Pie Chart & Quality Checks) */}
              <div className="absolute -bottom-6 -right-4 sm:-right-8 z-20 w-44 sm:w-56 bg-slate-900 rounded-xl border-2 border-slate-500 shadow-2xl p-2 text-slate-900 shadow-black/90">
                <div className="bg-white rounded-lg p-2.5 space-y-1.5">
                  <div className="text-[9px] font-bold text-slate-800 border-b border-slate-200 pb-1">
                    Sample household listing form with sample data
                  </div>

                  {/* Pie Chart & Stats Row */}
                  <div className="flex items-center space-x-2">
                    {/* SVG Pie Chart */}
                    <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                        {/* Slice 1 (Emerald) */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray="30 70" strokeDashoffset="0" />
                        {/* Slice 2 (Coral/Red) */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f43f5e" strokeWidth="6" strokeDasharray="25 75" strokeDashoffset="-30" />
                        {/* Slice 3 (Amber) */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray="20 80" strokeDashoffset="-55" />
                        {/* Slice 4 (Cyan) */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#06b6d4" strokeWidth="6" strokeDasharray="15 85" strokeDashoffset="-75" />
                        {/* Slice 5 (Purple) */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#8b5cf6" strokeWidth="6" strokeDasharray="10 90" strokeDashoffset="-90" />
                      </svg>
                      <span className="absolute text-[8px] font-bold text-slate-700">173</span>
                    </div>

                    {/* Stats List */}
                    <div className="text-[8px] space-y-0.5 text-slate-600 font-mono">
                      <div><strong className="text-slate-800">N:</strong> 173</div>
                      <div><strong className="text-slate-800">Missing:</strong> 0</div>
                      <div><strong className="text-slate-800">Mean:</strong> 3.62</div>
                      <div><strong className="text-slate-800">Max:</strong> 11</div>
                    </div>
                  </div>

                  {/* Quality Check Advisory Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded p-1 text-[7.5px] text-amber-900 flex items-center space-x-1">
                    <span className="font-bold text-amber-700">▲ Quality checks:</span>
                    <span>1 outlier verified</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ==================== 2. COMPLETE PRODUCT & FEATURES SUITE ==================== */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-b border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center space-x-2 bg-blue-950/60 border border-blue-500/40 px-3 py-1 rounded-full text-blue-400 text-xs font-bold font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>FULL PRODUCT &amp; CAPABILITY MATRIX</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            CMRG Survey Products &amp; Features
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Everything your field research organization needs — from high-assurance questionnaire design and advanced offline enumeration to AI-powered optimization and case management.
          </p>
        </div>

        {/* Mega Grid: Product Column (Left) and Features Grid (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Product (3 items) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xl font-bold text-[#38bdf8] flex items-center space-x-2 border-b border-white/10 pb-2">
              <Smartphone className="w-5 h-5 text-[#38bdf8]" />
              <span>Product</span>
            </h3>

            <div className="space-y-3">
              {productSuite.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFeatureItem(item)}
                  className="p-4 rounded-xl bg-[#0c121d] border border-white/10 hover:border-[#38bdf8] transition-all cursor-pointer group hover:bg-[#101929]"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      {item.id === 'prod_overview' && <Smartphone className="w-5 h-5" />}
                      {item.id === 'prod_how_it_works' && <ListOrdered className="w-5 h-5" />}
                      {item.id === 'prod_integrations' && <Network className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm group-hover:text-[#38bdf8] transition-colors flex items-center space-x-1.5">
                        <span>{item.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#38bdf8]" />
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">
                        {item.tagline}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Features (8 items in a 2-column grid) */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-xl font-bold text-[#38bdf8] flex items-center space-x-2 border-b border-white/10 pb-2">
              <Sparkles className="w-5 h-5 text-[#38bdf8]" />
              <span>Features</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {featuresSuite.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFeatureItem(item)}
                  className="p-4 rounded-xl bg-[#0c121d] border border-white/10 hover:border-[#38bdf8] transition-all cursor-pointer group hover:bg-[#101929]"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      {item.id === 'feat_overview' && <Monitor className="w-5 h-5" />}
                      {item.id === 'feat_data_quality' && <Database className="w-5 h-5" />}
                      {item.id === 'feat_offline' && <WifiOff className="w-5 h-5" />}
                      {item.id === 'feat_datasets' && <FileSpreadsheet className="w-5 h-5" />}
                      {item.id === 'feat_ai' && <BrainCircuit className="w-5 h-5" />}
                      {item.id === 'feat_mobile_app' && <Tablet className="w-5 h-5" />}
                      {item.id === 'feat_case_mgmt' && <Link2 className="w-5 h-5" />}
                      {item.id === 'feat_security' && <Lock className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm group-hover:text-[#38bdf8] transition-colors flex items-center space-x-1.5">
                        <span>{item.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#38bdf8]" />
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">
                        {item.tagline}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ==================== PRODUCT / FEATURE DETAIL MODAL ==================== */}
      {selectedFeatureItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0e1422] border border-white/20 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedFeatureItem(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#0284c7]/20 border border-[#0284c7]/40 text-[#38bdf8] text-xs font-bold font-mono uppercase">
                <span>{selectedFeatureItem.category} Architecture</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                {selectedFeatureItem.title}
              </h3>
              <p className="text-sm font-medium text-[#38bdf8]">
                {selectedFeatureItem.tagline}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {selectedFeatureItem.description}
            </p>

            <div className="space-y-2 bg-black/40 border border-white/10 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                CMRG Implementation Highlights:
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {selectedFeatureItem.capabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Production Ready</span>
              </span>

              <button
                onClick={() => {
                  const target = selectedFeatureItem.targetView;
                  setSelectedFeatureItem(null);
                  onLaunchApp(target);
                }}
                className="px-5 py-2.5 bg-[#FF2D20] hover:bg-[#E0261A] text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-red-950/40 cursor-pointer"
              >
                <span>{selectedFeatureItem.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. FEATURES SECTION (10 CARDS) ==================== */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-b border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="flex items-center justify-center space-x-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="w-2 h-2 bg-[#FF2D20] rounded-[1px]" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Enterprise Survey Research Capabilities
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Engineered to fulfill all rigorous requirements of commercial research fieldwork without external vendor lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Questionnaire Builder */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">1. Questionnaire Builder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Professional no-code builder supporting 20+ question types, sections, groups, repeat loops, choice lists, hints, default values, and real-time interactive QA simulation.
            </p>
          </div>

          {/* 2. Offline Data Collection */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">2. Offline Data Collection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              100% offline-first field operation. Enumerators download blank forms once and conduct full interviews without internet connectivity, safely storing drafts and completed records.
            </p>
          </div>

          {/* 3. CMRG Collect */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">3. CMRG Collect Android</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native Android application built in Flutter with local SQLite database, responsive mobile stepper, audio recording, camera photo capture, and instant background sync queue.
            </p>
          </div>

          {/* 4. GPS & Media */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">4. GPS & Media</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Precision geopoint coordinates with accuracy radius (±m), photo evidence capture, audio interview recordings, and digital signature pads tied to respondent submissions.
            </p>
          </div>

          {/* 5. Smart Skip Logic */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">5. Smart Skip Logic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Universal evaluation engine parsing expressions like {'${owns_phone} = \'yes\''}, numeric constraints ('. &gt;= 18 and . &lt;= 65'), and dynamic live field calculations.
            </p>
          </div>

          {/* 6. Team Management */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">6. Team Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Granular 5-tier role-based access control (Admin, Project Manager, Supervisor, Enumerator, Data Analyst) with project isolation and field device tracking.
            </p>
          </div>

          {/* 7. Real-Time Monitoring */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">7. Real-Time Monitoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Live fieldwork dashboards reporting submissions velocity, enumerator performance, pending sync queues, supervisor QA review status, and GPS distribution.
            </p>
          </div>

          {/* 8. Data Export */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">8. Data Export</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant multi-format exports: structured Excel (.xlsx) complete with variable dictionary codebook sheets, standard CSV, and clean raw JSON for statistical packages.
            </p>
          </div>

          {/* 9. Form Versioning */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">9. Form Versioning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Immutable version snapshots. When survey questions change, new versions are deployed to devices without corrupting historical data or invalidating prior interview submissions.
            </p>
          </div>

          {/* 10. Secure Research Data */}
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors lg:col-span-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-[#FF2D20]/40 flex items-center justify-center text-[#FF2D20]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">10. Secure Research Data & Sovereignty</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise PostgreSQL backend, audit logging of all logins and reviews, cryptographic database backups with SHA-256 checksums, and total air-gapped data ownership.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== 3. HOW IT WORKS SECTION ==================== */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-b border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-mono font-bold tracking-widest text-[#FF2D20] uppercase">
            END-TO-END RESEARCH WORKFLOW
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How CMRG Survey Works
          </h2>
          <p className="text-slate-400 text-sm">
            From initial questionnaire design through offline fieldwork collection to final data analysis.
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-center">
          {[
            { step: '1', title: 'BUILD', desc: 'Visual builder or drag & drop XLSForm import' },
            { step: '2', title: 'PUBLISH', desc: 'Create immutable version tag & audit snapshot' },
            { step: '3', title: 'ASSIGN', desc: 'Deploy target forms to enumerators or teams' },
            { step: '4', title: 'COLLECT', desc: 'Capture offline interviews via CMRG Collect' },
            { step: '5', title: 'SYNC', desc: 'Idempotent UUID sync upon network reconnect' },
            { step: '6', title: 'MONITOR', desc: 'Supervisor quality review & GPS spot audits' },
            { step: '7', title: 'EXPORT', desc: 'Generate SPSS/Stata ready XLSX, CSV, JSON' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#0c101a] border border-white/10 space-y-2 relative group hover:border-[#FF2D20] transition-colors">
              <div className="w-7 h-7 rounded-full bg-red-950/80 border border-[#FF2D20] text-[#FF2D20] font-mono font-bold text-xs flex items-center justify-center mx-auto">
                {item.step}
              </div>
              <h4 className="font-extrabold text-white text-xs tracking-wider">{item.title}</h4>
              <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
              {idx < 6 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 text-xs">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 4. CMRG COLLECT ANDROID SECTION ==================== */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-red-950/40 border border-[#FF2D20]/40 px-3 py-1 rounded-lg text-[#FF2D20] text-xs font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>NATIVE ANDROID FIELD CLIENT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Collect data anywhere, even without internet.
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              CMRG Collect is the official Android APK field tool engineered for remote enumeration. It stores blank questionnaires, preserves unfinished interview drafts in local SQLite tables, captures GPS coordinates, and safely queues finalized submissions.
            </p>

            {/* Architecture Relationship: Web Platform <-> Mobile */}
            <div className="p-5 rounded-2xl bg-[#0e131e] border border-white/15 space-y-3">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center justify-between">
                <span>PLATFORM INTEROPERABILITY</span>
                <span className="text-emerald-400">BI-DIRECTIONAL SYNC</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center text-center text-xs">
                <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                  <div className="font-bold text-white">CMRG Survey</div>
                  <div className="text-[10px] text-slate-400">Central Web Console</div>
                </div>
                <div className="text-[#FF2D20] font-bold text-lg">
                  ↕
                </div>
                <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                  <div className="font-bold text-white">CMRG Collect</div>
                  <div className="text-[10px] text-slate-400">Android Field APK</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-2">
              <button
                onClick={() => onLaunchApp('collect')}
                className="px-5 py-3 bg-[#FF2D20] hover:bg-[#E0261A] text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-red-600/20 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Test Collect In Browser</span>
              </button>
              <span className="text-xs text-slate-400 font-mono">
                Source: <span className="text-slate-200">/mobile (Flutter / Android)</span>
              </span>
            </div>
          </div>

          {/* Right Mobile Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-72 bg-black border-4 border-slate-700 rounded-[2.5rem] shadow-2xl p-3">
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />
              <div className="bg-[#0b111a] rounded-[1.8rem] overflow-hidden border border-white/10 text-xs">
                <div className="bg-[#FF2D20] px-3.5 py-3 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CMRGLogo size="sm" variant="white" showRC={false} />
                  </div>
                  <span className="text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded">OFFLINE ACTIVE</span>
                </div>

                <div className="p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-white">CMRG Retail Audit 2026</span>
                    <span className="text-[#FF2D20] font-mono">v2.0</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-[#FF2D20] h-1.5 rounded-full w-3/4" />
                  </div>

                  <div className="bg-[#121824] rounded-xl p-3 border border-white/10 space-y-2">
                    <span className="text-[9px] font-mono uppercase text-[#FF2D20] font-bold">Question 6 of 8</span>
                    <div className="font-bold text-slate-100 text-xs leading-snug">
                      Is the beverage cooler visible from the store entrance?
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="p-2 rounded-lg bg-black/60 border border-[#FF2D20] text-white flex items-center justify-between">
                        <span className="font-medium text-[11px]">Yes, directly visible</span>
                        <span className="w-2 h-2 rounded-full bg-[#FF2D20]" />
                      </div>
                      <div className="p-2 rounded-lg bg-black/30 border border-white/10 text-slate-300 flex items-center justify-between text-[11px]">
                        <span>Partially obstructed</span>
                        <span className="w-2 h-2 rounded-full border border-slate-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-[#FF2D20]" />
                      <span>GPS: ±2.4m accuracy</span>
                    </div>
                    <span className="text-emerald-400 font-mono">LOCKED</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px]">
                      Previous
                    </button>
                    <button className="px-4 py-1.5 bg-[#FF2D20] text-white font-bold rounded-lg text-[10px]">
                      Complete →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 5. WHY CMRG SURVEY SECTION ==================== */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-b border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="flex items-center justify-center space-x-1 mb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="w-2 h-2 bg-[#FF2D20] rounded-[1px]" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Why CMRG Survey
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Strategic organizational advantages of a CMRG-owned, sovereign research data stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <h3 className="text-base font-bold text-white">Reduced Dependency on External Platforms</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Eliminate recurring per-enumerator and per-submission license fees charged by foreign survey software vendors.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <h3 className="text-base font-bold text-white">CMRG-Controlled Infrastructure</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All respondent answers, location coordinates, audio recordings, and photos reside on CMRG-managed servers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <h3 className="text-base font-bold text-white">Offline Fieldwork Reliability</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uncompromising offline capability ensuring remote enumeration proceeds smoothly regardless of telecom network blackouts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <h3 className="text-base font-bold text-white">Flexible Questionnaire Design</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct XLSForm compatibility combined with a visual builder for fast study authoring, testing, and deployment.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <h3 className="text-base font-bold text-white">Centralized Research Data</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unify qualitative and quantitative fieldwork streams into a single standardized data pipeline with audit logs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3 hover:border-[#FF2D20] transition-colors">
            <h3 className="text-base font-bold text-white">Scalable Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built on Node.js/TypeScript, PostgreSQL migrations, and Flutter to scale seamlessly from 10 to 10,000 enumerators.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== 6. PRODUCT SCREENSHOTS / INTERACTIVE UI SHOWCASE ==================== */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-b border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-mono font-bold tracking-widest text-[#FF2D20] uppercase">
            LIVE SYSTEM INTERFACES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Actual Platform Modules
          </h2>
          <p className="text-slate-400 text-sm">
            Inspect the genuine UI screens powering CMRG operations.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center space-x-2 mb-8 overflow-x-auto">
          {[
            { id: 'console', label: 'Central Dashboard' },
            { id: 'builder', label: 'Questionnaire Builder' },
            { id: 'submissions', label: 'Submissions & QA' },
            { id: 'mobile', label: 'CMRG Collect' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveUiTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeUiTab === tab.id
                  ? 'bg-[#FF2D20] text-white shadow-lg shadow-red-600/30'
                  : 'bg-black/50 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Showcase Frame */}
        <div className="bg-[#0b0f19] rounded-2xl border border-white/20 p-4 sm:p-6 shadow-2xl">
          {activeUiTab === 'console' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                <span className="font-bold text-white">CMRG Central Overview</span>
                <span className="text-emerald-400 font-mono">Live PostgreSQL Engine</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-black/40 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Active Studies</div>
                  <div className="text-xl font-bold text-white">4</div>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Questionnaires</div>
                  <div className="text-xl font-bold text-white">6</div>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Submissions</div>
                  <div className="text-xl font-bold text-[#FF2D20]">2,418</div>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Active Devices</div>
                  <div className="text-xl font-bold text-emerald-400">32</div>
                </div>
              </div>
            </div>
          )}

          {activeUiTab === 'builder' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-white">No-Code Question Editor</span>
                <span className="text-[#FF2D20] font-mono">20 Question Types</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">respondent_age (integer)</div>
                  <div className="text-[11px] text-slate-400">Constraint: . &gt;= 0 and . &lt;= 120</div>
                </div>
                <span className="text-[10px] bg-red-950/60 text-red-300 px-2 py-0.5 rounded border border-red-500/40">REQUIRED</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">owns_smartphone (select_one)</div>
                  <div className="text-[11px] text-slate-400">Choices: 1=Yes, 2=No</div>
                </div>
                <span className="text-[10px] bg-red-950/60 text-red-300 px-2 py-0.5 rounded border border-red-500/40">REQUIRED</span>
              </div>
            </div>
          )}

          {activeUiTab === 'submissions' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-white">Supervisor QA &amp; Data Review</span>
                <span className="text-emerald-400 font-mono">Export: XLSX • CSV • JSON</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">sub_srv_102 • Tunde Adebayo</div>
                  <div className="text-[11px] text-slate-400">GPS: 9.0765, 7.3986 (±4.2m) • Client UUID: client_uuid_002</div>
                </div>
                <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">APPROVED</span>
              </div>
            </div>
          )}

          {activeUiTab === 'mobile' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-white">CMRG Collect Android Client</span>
                <span className="text-amber-400 font-mono">Offline SQLite Engine</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">CMRG Household Survey 2026 (v2.0)</div>
                  <div className="text-[11px] text-slate-400">Status: Ready for offline enumeration</div>
                </div>
                <span className="text-[10px] bg-blue-950/60 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40">DOWNLOADED</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================== 7. TEAM / CREDITS SECTION ==================== */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-b border-white/10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest text-[#FF2D20] uppercase">
            PRODUCT TEAM &amp; CREDITS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Built by Afolabi Oluwadamilare Simeon and Samuel Korede, with the wider product, engineering and creative team.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 max-w-lg mx-auto text-left">
            <div className="p-5 rounded-xl bg-[#0c101a] border border-white/10 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Lead Engineer</div>
              <div className="text-base font-bold text-white">Afolabi Oluwadamilare Simeon</div>
              <div className="text-xs text-[#FF2D20] font-medium">Full Stack App Developer</div>
            </div>

            <div className="p-5 rounded-xl bg-[#0c101a] border border-white/10 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Strategy &amp; Brand</div>
              <div className="text-base font-bold text-white">Samuel Korede</div>
              <div className="text-xs text-[#FF2D20] font-medium">Full Stack App Developer &amp; Brand Strategist</div>
            </div>
          </div>

          <p className="text-xs text-slate-400 pt-2">
            and the wider product, engineering and creative team.
          </p>
        </div>
      </section>

      {/* ==================== 8. FOOTER ==================== */}
      <footer className="border-t border-white/10 bg-[#05070a] py-12 px-6 sm:px-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center space-x-3">
              <CMRGLogo size="sm" variant="white" />
            </div>
            <div className="text-sm font-bold text-white">
              CMRG Survey
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Professional Research Data Collection Platform. Empowering rigorous survey design, offline enumeration, and verifiable field research.
            </p>
          </div>

          <div className="lg:col-span-6 space-y-2 sm:text-right">
            <div className="text-slate-300 font-semibold">
              Built by Afolabi Oluwadamilare Simeon
            </div>
            <div className="text-slate-400">
              Full Stack App Developer
            </div>
            <div className="text-slate-300 font-semibold pt-1">
              Samuel Korede
            </div>
            <div className="text-slate-400">
              Full Stack App Developer &amp; Brand Strategist
            </div>
            <div className="text-slate-500 pt-3">
              © CMRG
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLanding;
