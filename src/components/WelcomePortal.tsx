import React, { useState, useEffect } from 'react';
import { CMRGLogo } from './CMRGLogo';
import {
  Shield,
  ArrowRight,
  Smartphone,
  Database,
  CheckCircle2,
  Lock,
  Server,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { User, UserRole, ServerStatusInfo } from '../../shared/types';
import { loginServer, registerServer, fetchServerStatus, fetchCollectQuickConfig } from '../lib/api';

interface WelcomePortalProps {
  onLoginSuccess: (user: User) => void;
  onExploreMarketing: () => void;
  currentUser: User;
}

export const WelcomePortal: React.FC<WelcomePortalProps> = ({
  onLoginSuccess,
  onExploreMarketing,
  currentUser
}) => {
  // Auth mode: 'login' | 'register' | 'server_connect'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'server_connect'>('login');

  // Server state
  const [serverName, setServerName] = useState(() => localStorage.getItem('cmrg_server_name') || 'cmrg');
  const [serverStatus, setServerStatus] = useState<ServerStatusInfo | null>(null);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('amina.bello@cmrg.org');
  const [loginPassword, setLoginPassword] = useState('CMRG_Dev_Admin_Pass_2026!');
  const [showPassword, setShowPassword] = useState(false);

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regOrg, setRegOrg] = useState('CMRG Ltd.');
  const [regRole, setRegRole] = useState<UserRole>('ENUMERATOR');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [collectConfig, setCollectConfig] = useState<any>(null);

  // Load server telemetry
  useEffect(() => {
    fetchServerStatus()
      .then(status => setServerStatus(status))
      .catch(err => console.warn('Could not fetch server status:', err));
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds(prev => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Handle Preset Account Quick Selection
  const applyPreset = (role: UserRole, email: string) => {
    setLoginEmail(email);
    setLoginPassword('CMRG_Dev_Admin_Pass_2026!');
    setErrorMessage(null);
  };

  // Handle Login submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your email, username, or User ID.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginServer({
        email: loginEmail.trim(),
        password: loginPassword,
        serverName: serverName.trim()
      });

      if (res.success && res.user) {
        setSuccessNotice(`Authentication verified by ${res.serverInfo?.serverName || serverName} server node.`);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 350);
      }
    } catch (err: any) {
      if (err.locked && err.remainingSeconds) {
        setLockoutSeconds(err.remainingSeconds);
        setErrorMessage(`Server lockout: Multiple failed authentication attempts. Please wait ${err.remainingSeconds}s.`);
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!regName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (regPassword && regPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters with numbers or symbols.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerServer({
        name: regName.trim(),
        email: regEmail.trim(),
        username: regUsername.trim() || regEmail.split('@')[0],
        password: regPassword,
        organizationName: regOrg.trim(),
        serverName: serverName.trim(),
        role: regRole
      });

      if (res.success && res.user) {
        setSuccessNotice('Account created successfully! Connecting to server session...');
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load mobile quick-connect configuration
  const handleLoadCollectConfig = async () => {
    try {
      const cfg = await fetchCollectQuickConfig(`https://${serverName.toLowerCase()}.survey.cloud`);
      setCollectConfig(cfg);
    } catch (err) {
      console.warn('Failed to load quick config:', err);
    }
  };

  useEffect(() => {
    if (authMode === 'server_connect' && !collectConfig) {
      handleLoadCollectConfig();
    }
  }, [authMode]);

  return (
    <div className="relative min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Background Scenic Field Landscape */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity filter contrast-125"
        style={{
          backgroundImage: `url('/src/assets/images/cmrg_field_hero_1788971095002.jpg')`,
        }}
      />
      {/* Gradient Overlay with Red & Black Tones */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black via-black/85 to-black/60" />
      <div className="absolute inset-0 z-0 cmrg-pattern-grid opacity-30 pointer-events-none" />

      {/* Top Bar with Server Node Telemetry */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-xs">
        <div className="flex items-center space-x-4">
          <CMRGLogo size="md" variant="white" />
          <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-white/15 text-xs text-slate-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">NODE:</span>
            <span className="font-mono text-slate-200">{serverStatus?.clusterNode || 'CMRG-SERVER-LGS-01'}</span>
            <span className="text-white/20">|</span>
            <span className="text-[11px] text-slate-400">TLS 1.3 / AES-256</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-switch-server-view"
            onClick={() => setAuthMode(authMode === 'server_connect' ? 'login' : 'server_connect')}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors flex items-center space-x-1.5"
          >
            <Server className="w-3.5 h-3.5 text-[#FF2D20]" />
            <span>{authMode === 'server_connect' ? 'Back to Sign In' : 'Server Status & APK'}</span>
          </button>
          <button
            onClick={onExploreMarketing}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
          >
            Explore Public Platform
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Side: Server-Style Auth Console */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-[#0f141d]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Top Server Branding Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF2D20] font-bold">
                  Self-Hosted Survey Server
                </span>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span>Server Console</span>
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    ({serverName}.survey.cloud)
                  </span>
                </h2>
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>ONLINE</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 p-1 bg-black/50 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                id="tab-btn-signin"
                onClick={() => { setAuthMode('login'); setErrorMessage(null); }}
                className={`py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  authMode === 'login'
                    ? 'bg-[#FF2D20] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                id="tab-btn-register"
                onClick={() => { setAuthMode('register'); setErrorMessage(null); }}
                className={`py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  authMode === 'register'
                    ? 'bg-[#FF2D20] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register User</span>
              </button>
            </div>

            {/* Error or Alert banner */}
            {errorMessage && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Success notice */}
            {successNotice && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1 font-medium">{successNotice}</div>
              </div>
            )}

            {/* Lockout countdown timer banner */}
            {lockoutSeconds !== null && lockoutSeconds > 0 && (
              <div className="p-3 bg-amber-950/70 border border-amber-500/50 rounded-xl text-amber-200 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Brute-force security lockout active</span>
                </div>
                <span className="font-mono font-bold text-amber-300">{lockoutSeconds}s</span>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {authMode === 'login' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Server Name / Domain input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Server Name / Organization Domain</span>
                    <span className="text-[10px] text-slate-400 font-normal">Self-Hosted</span>
                  </label>
                  <div className="relative">
                    <Server className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="input-server-name"
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="e.g. cmrg or survey-cluster"
                      className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-24 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF2D20] font-mono"
                    />
                    <div className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono pointer-events-none">
                      .survey.cloud
                    </div>
                  </div>
                </div>

                {/* Email / Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="input-login-email"
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@cmrg.org or username"
                      className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF2D20]"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-400">Argon2 / PBKDF2</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF2D20]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  id="btn-server-login"
                  type="submit"
                  disabled={isLoading || (lockoutSeconds !== null && lockoutSeconds > 0)}
                  className="w-full mt-2 bg-[#FF2D20] hover:bg-[#e02619] disabled:opacity-50 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating with Server...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to {serverName.toUpperCase()} Server</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Preset Accounts for Rapid Field Testing */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Quick-fill test credentials:</span>
                    <span className="text-[10px] text-[#FF2D20] font-mono">1-CLICK</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      id="btn-preset-admin"
                      onClick={() => applyPreset('ADMIN', 'amina.bello@cmrg.org')}
                      className="text-[11px] px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-left transition-colors"
                    >
                      <div className="font-bold text-[10px] text-red-400">Admin</div>
                      <div className="truncate text-slate-400 text-[10px]">Dr. Amina</div>
                    </button>
                    <button
                      type="button"
                      id="btn-preset-supervisor"
                      onClick={() => applyPreset('SUPERVISOR', 'fatima.yusuf@cmrg.org')}
                      className="text-[11px] px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-left transition-colors"
                    >
                      <div className="font-bold text-[10px] text-amber-400">Supervisor</div>
                      <div className="truncate text-slate-400 text-[10px]">Fatima Y.</div>
                    </button>
                    <button
                      type="button"
                      id="btn-preset-enumerator"
                      onClick={() => applyPreset('ENUMERATOR', 'tunde.adebayo@cmrg.org')}
                      className="text-[11px] px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-left transition-colors"
                    >
                      <div className="font-bold text-[10px] text-emerald-400">Enumerator</div>
                      <div className="truncate text-slate-400 text-[10px]">Tunde A.</div>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER ACCOUNT */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Organization / Ministry
                  </label>
                  <input
                    type="text"
                    value={regOrg}
                    onChange={(e) => setRegOrg(e.target.value)}
                    placeholder="Consumer & Market Research Group Ltd."
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF2D20]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Afolabi Simeon"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF2D20]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      System Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#FF2D20]"
                    >
                      <option value="ENUMERATOR">Mobile Enumerator</option>
                      <option value="SUPERVISOR">Field Supervisor</option>
                      <option value="DATA_ANALYST">Data Analyst</option>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="ADMIN">Server Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="user@cmrg.org"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF2D20]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Username (Optional)
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="afolabi.s"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF2D20]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password (8+ chars)
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF2D20]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF2D20]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-[#FF2D20] hover:bg-[#e02619] disabled:opacity-50 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all"
                >
                  {isLoading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Register on {serverName.toUpperCase()} Server</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: SERVER STATUS & COLLECT QUICK CONNECT */}
            {authMode === 'server_connect' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-white/10 pb-2">
                    <span className="flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#FF2D20]" />
                      <span>Cluster Telemetry</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">STATUS: OPERATIONAL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400">Node ID:</span>{' '}
                      <span className="font-mono text-white">{serverStatus?.clusterNode || 'CMRG-LGS-01'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">TLS Layer:</span>{' '}
                      <span className="font-mono text-emerald-300">{serverStatus?.tlsVersion || 'TLS 1.3'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Encryption:</span>{' '}
                      <span className="font-mono text-white">{serverStatus?.encryptionStandard || 'AES-256-GCM'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Engine:</span>{' '}
                      <span className="font-mono text-slate-200">{serverStatus?.engineVersion || 'v2.92-PROD'}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile APK Quick Connect parameters */}
                <div className="p-3.5 rounded-xl bg-red-950/30 border border-[#FF2D20]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <Smartphone className="w-4 h-4 text-[#FF2D20]" />
                      <span>CMRG Collect (Android APK) Sync Key</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (collectConfig) {
                          navigator.clipboard.writeText(JSON.stringify(collectConfig, null, 2));
                          setCopiedConfig(true);
                          setTimeout(() => setCopiedConfig(false), 2000);
                        }
                      }}
                      className="text-[10px] font-semibold text-red-300 hover:text-white px-2 py-1 rounded bg-[#FF2D20]/30 hover:bg-[#FF2D20]/50 transition-colors flex items-center space-x-1"
                    >
                      {copiedConfig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedConfig ? 'Copied' : 'Copy Config'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Use these server parameters in the mobile app settings to pair Android phones with this server:
                  </p>
                  <div className="bg-black/60 rounded-lg p-2 font-mono text-[11px] space-y-1 text-slate-200 border border-white/10">
                    <div><span className="text-slate-500">Server URL:</span> https://{serverName.toLowerCase()}.survey.cloud</div>
                    <div><span className="text-slate-500">Protocol:</span> SurveyCTO Compatible REST Sync</div>
                    <div><span className="text-slate-500">Auth Token:</span> {collectConfig?.authKey ? `${collectConfig.authKey.slice(0, 12)}••••••••` : 'cmrg_mobile_token_verified'}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs py-2.5 px-4 rounded-xl border border-white/10 transition-colors"
                >
                  Return to Server Login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Welcome to CMRG! Powered by CMRG Internal Devteam */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 lg:pl-6">
          <div className="space-y-3">
            {/* The signature red squares motif */}
            <div className="flex flex-col space-y-1 mb-2">
              <div className="flex items-center space-x-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="w-2.5 h-2.5 bg-[#FF2D20] rounded-[1px]" />
                ))}
              </div>
              <div className="flex items-center space-x-1 ml-2.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="w-2.5 h-2.5 bg-[#FF2D20] rounded-[1px]" />
                ))}
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Welcome to <span className="text-[#FF2D20]">CMRG</span>!
            </h1>

            <p className="text-xl sm:text-2xl font-medium text-slate-300 flex items-center space-x-2">
              <span>Powered by</span>
              <span className="text-white font-extrabold underline decoration-[#FF2D20] decoration-2 underline-offset-4">
                CMRG Internal Devteam
              </span>
            </p>

            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
              An enterprise, offline-first research and data collection infrastructure built exclusively for CMRG's field operations, survey enumerators, and analytical researchers.
            </p>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start space-x-3">
              <div className="p-2 bg-red-950/50 border border-[#FF2D20]/40 rounded-lg text-[#FF2D20]">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">100% Offline Field App</h4>
                <p className="text-[11px] text-slate-400">Collect data anywhere without network or cellular towers.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start space-x-3">
              <div className="p-2 bg-red-950/50 border border-[#FF2D20]/40 rounded-lg text-[#FF2D20]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Zero Form Rebuilding</h4>
                <p className="text-[11px] text-slate-400">Import existing XLSForm (.xlsx) or Excel questionnaires instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full px-6 sm:px-12 py-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center space-x-3">
          <span>Copyright © CMRG Ltd. (RC378525). All rights reserved.</span>
          <span className="text-slate-600">•</span>
          <span className="text-[#FF2D20] font-semibold">Powered by CMRG Internal Devteam</span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('CMRG Internal Data Governance Policy: Confidential Research Protocols'); }} className="hover:text-white">
            Security & Data Privacy
          </a>
          <a href="#support" onClick={(e) => { e.preventDefault(); alert('CMRG Devteam Support: devteam@cmrg.org'); }} className="hover:text-white">
            Devteam Support
          </a>
        </div>
      </footer>
    </div>
  );
};
