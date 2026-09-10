import React from 'react';
import {
  Database,
  Wifi,
  WifiOff,
  Smartphone,
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  Send,
  Layers,
  Sparkles,
  LogIn,
  Users,
  KeyRound
} from 'lucide-react';
import { CMRGLogo } from './CMRGLogo';
import { User, UserRole } from '../../shared/types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenImportModal?: () => void;
  onOpenSecretsModal?: () => void;
  isOfflineSimulated: boolean;
  onToggleOffline: () => void;
  currentUser: User;
  onSwitchUser?: (user: User) => void;
  onSwitchUserRole?: (role: UserRole) => void;
  pendingSyncCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenImportModal,
  onOpenSecretsModal,
  isOfflineSimulated,
  onToggleOffline,
  currentUser,
  onSwitchUser,
  pendingSyncCount
}) => {
  const presetUsers: User[] = [
    {
      id: 'usr_admin_1',
      name: 'Dr. Amina Bello',
      email: 'amina.bello@cmrg.org',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_pm_1',
      name: 'Chinedu Okafor',
      email: 'chinedu.okafor@cmrg.org',
      role: 'PROJECT_MANAGER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_sup_1',
      name: 'Fatima Yusuf',
      email: 'fatima.yusuf@cmrg.org',
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_enum_1',
      name: 'Tunde Adebayo',
      email: 'tunde.adebayo@cmrg.org',
      role: 'ENUMERATOR',
      status: 'ACTIVE',
      deviceId: 'CMRG-TECNO-CAMON-01',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_analyst_1',
      name: 'Dr. Zainab Aliyu',
      email: 'zainab.aliyu@cmrg.org',
      role: 'DATA_ANALYST',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <header className="bg-[#05070a] text-white border-b border-white/10 sticky top-0 z-40 shadow-xl">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo: CMRG Ltd. RC378525 */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onNavigate('marketing')}
            title="CMRG Ltd. (RC378525) - Powered by CMRG Internal Devteam"
          >
            <CMRGLogo size="sm" variant="white" showRC={true} />
            <div className="hidden lg:flex items-center pl-3 border-l border-white/15">
              <span className="text-[10px] text-slate-400 font-medium">
                Internal Devteam
              </span>
            </div>
          </div>

          {/* Center Main Views Switcher */}
          <div className="hidden md:flex items-center bg-[#0d121c] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => onNavigate('marketing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                currentView === 'marketing'
                  ? 'bg-white text-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF2D20]" />
              <span>Platform Landing</span>
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                ['dashboard', 'projects', 'forms', 'builder', 'submissions', 'deployments'].includes(currentView)
                  ? 'bg-[#FF2D20] text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>CMRG Central</span>
            </button>

            <button
              onClick={() => onNavigate('collect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all relative cursor-pointer ${
                currentView === 'collect'
                  ? 'bg-[#FF2D20] text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>CMRG Collect (Field)</span>
              {pendingSyncCount > 0 && (
                <span className="bg-amber-400 text-black text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full animate-bounce">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('welcome')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                currentView === 'welcome'
                  ? 'bg-[#FF2D20] text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-[#FF2D20]" />
              <span>Welcome Portal</span>
            </button>
          </div>

          {/* Right Controls: Import Form Button, Offline Toggle, User Switch */}
          <div className="flex items-center space-x-2.5">
            {/* Quick Import Existing Form Action */}
            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-black/60 hover:bg-black text-white text-xs font-bold rounded-xl border border-white/20 hover:border-[#FF2D20] transition-colors cursor-pointer"
                title="Import existing XLSForm (.xlsx) or Excel file without rebuilding"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF2D20]" />
                <span>Import Form</span>
              </button>
            )}

            {/* System DB Backup */}
            <button
              onClick={async () => {
                try {
                  const { downloadBackup } = await import('../lib/api');
                  await downloadBackup();
                } catch (err: any) {
                  alert(`Backup error: ${err.message}`);
                }
              }}
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 bg-black/60 hover:bg-black text-white text-xs font-bold rounded-xl border border-white/20 hover:border-blue-500 transition-colors cursor-pointer"
              title="Download Full Database Backup (PostgreSQL / JSON with Checksum)"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Backup DB</span>
            </button>

            {/* Simulated Secrets & VS Code Handoff Button */}
            {onOpenSecretsModal && (
              <button
                onClick={onOpenSecretsModal}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-950/70 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 hover:border-amber-400 transition-colors cursor-pointer"
                title="Secrets are actively simulated in sandbox — Click to view status & export VS Code .env"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[10px] tracking-tight">SECRETS: SIMULATED</span>
              </button>
            )}

            {/* Field Offline Simulator Toggle */}
            <button
              onClick={onToggleOffline}
              title={isOfflineSimulated ? "Field Offline Simulation Active - Click to Reconnect" : "Simulate Offline Field Mode"}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                isOfflineSimulated
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                  : 'bg-black/60 text-slate-300 border-white/15 hover:border-emerald-500/40'
              }`}
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline font-mono text-[10px] text-amber-300">OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline font-mono text-[10px] text-emerald-400">ONLINE</span>
                </>
              )}
            </button>

            {/* Quick Role Switcher & Server Login Portal Button */}
            <div className="flex items-center bg-[#0d121c] rounded-xl p-0.5 border border-white/10">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const target = presetUsers.find(u => u.id === e.target.value);
                  if (target && onSwitchUser) onSwitchUser(target);
                }}
                className="bg-transparent text-[11px] text-slate-200 font-semibold py-1 px-2 focus:outline-hidden cursor-pointer"
              >
                {presetUsers.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                    {u.name.split(' ')[0]} ({u.role})
                  </option>
                ))}
              </select>

              <button
                type="button"
                id="btn-navbar-server-portal"
                onClick={() => onNavigate('welcome')}
                title="Open Server Login & Registration Console"
                className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#FF2D20]" />
              </button>
            </div>
          </div>

        </div>

        {/* Secondary Navigation for CMRG Central Console */}
        {['dashboard', 'projects', 'forms', 'builder', 'submissions', 'deployments'].includes(currentView) && (
          <div className="flex items-center space-x-1 overflow-x-auto py-2 border-t border-white/10 text-xs">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-white/10 text-[#FF2D20]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('projects')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                currentView === 'projects'
                  ? 'bg-white/10 text-[#FF2D20]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => onNavigate('forms')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                currentView === 'forms' || currentView === 'builder'
                  ? 'bg-white/10 text-[#FF2D20]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Questionnaires & Import
            </button>
            <button
              onClick={() => onNavigate('deployments')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                currentView === 'deployments'
                  ? 'bg-white/10 text-[#FF2D20]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Field Deployments
            </button>
            <button
              onClick={() => onNavigate('submissions')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                currentView === 'submissions'
                  ? 'bg-white/10 text-[#FF2D20]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Submissions & QA
            </button>

            {onOpenSecretsModal && (
              <button
                onClick={onOpenSecretsModal}
                className="ml-auto px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 flex items-center space-x-1 cursor-pointer shrink-0 transition-colors"
                title="View simulated secrets status & export .env template for VS Code"
              >
                <KeyRound className="w-3 h-3 text-amber-400" />
                <span>Simulated Secrets</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
