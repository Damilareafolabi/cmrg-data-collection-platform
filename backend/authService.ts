import crypto from 'crypto';
import { User, UserRole, ServerStatusInfo, CollectQuickConnectConfig } from '../shared/types';
import { getSecret } from './simulatedSecrets';

// Server instance configuration
export const SERVER_CONFIG = {
  defaultServerName: 'cmrg',
  serverDomain: 'cmrg.survey.cloud',
  clusterNode: 'CMRG-SERVER-LGS-01',
  engineVersion: 'v2.92-PROD-CMRG',
  tlsVersion: 'TLS 1.3 / OpenSSL 3.0',
  encryptionStandard: 'AES-256-GCM + PBKDF2-SHA512',
  startedAt: Date.now()
};

// Brute-force rate limiter state
interface RateLimitRecord {
  attempts: number;
  lastAttemptAt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds cooldown
const ATTEMPT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Checks if an identifier (IP or username) is currently locked out
 */
export function checkRateLimit(identifier: string): { isLocked: boolean; remainingSeconds?: number } {
  const record = loginAttempts.get(identifier);
  if (!record) return { isLocked: false };

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }

  // Clear if expired
  if (now - record.lastAttemptAt > ATTEMPT_EXPIRY_MS) {
    loginAttempts.delete(identifier);
    return { isLocked: false };
  }

  return { isLocked: false };
}

/**
 * Records a failed login attempt; triggers lockout if threshold reached
 */
export function recordFailedAttempt(identifier: string): { isLocked: boolean; attemptsLeft: number; remainingSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier) || { attempts: 0, lastAttemptAt: now };

  record.attempts += 1;
  record.lastAttemptAt = now;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(identifier, record);
    return {
      isLocked: true,
      attemptsLeft: 0,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000)
    };
  }

  loginAttempts.set(identifier, record);
  return {
    isLocked: false,
    attemptsLeft: MAX_ATTEMPTS - record.attempts
  };
}

/**
 * Clears rate limiting on successful authentication
 */
export function clearRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Generate cryptographically secure random salt
 */
export function generateSalt(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash password with PBKDF2 (100,000 iterations, SHA-512)
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

/**
 * Validates password with timing-safe comparison
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = hashPassword(password, salt);
    const hashBuf = Buffer.from(computedHash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (hashBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, storedBuf);
  } catch {
    return false;
  }
}

/**
 * Check password strength rules (SurveyCTO Enterprise Security Standard)
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password) && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number (0-9) or special symbol.' };
  }
  return { valid: true };
}

/**
 * Generate HMAC-SHA256 signed session token
 */
export function createSessionToken(user: User, serverName = SERVER_CONFIG.defaultServerName): string {
  const secret = getSecret('AUTH_SECRET').value;
  const payload = {
    uid: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    srv: serverName,
    iat: Date.now(),
    exp: Date.now() + 30 * 86400000 // 30 days
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `cmrg_sec_${payloadB64}.${signature}`;
}

/**
 * Verify HMAC-SHA256 signed session token
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: any; reason?: string } {
  if (!token || !token.startsWith('cmrg_sec_')) {
    // Support legacy fallback token prefix for existing sessions
    if (token && (token.startsWith('token_') || token.startsWith('usr_'))) {
      const parts = token.split('_');
      return { valid: true, payload: { uid: parts[1] || token } };
    }
    return { valid: false, reason: 'Invalid token format' };
  }

  const raw = token.replace('cmrg_sec_', '');
  const [payloadB64, signature] = raw.split('.');
  if (!payloadB64 || !signature) {
    return { valid: false, reason: 'Malformed token structure' };
  }

  const secret = getSecret('AUTH_SECRET').value;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  try {
    const isSigMatch = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(expectedSig, 'utf-8')
    );
    if (!isSigMatch) return { valid: false, reason: 'Invalid cryptographic signature' };

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false, reason: 'Session token has expired' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, reason: err.message || 'Token verification error' };
  }
}

/**
 * Get SurveyCTO Server Status Information
 */
export function getServerStatus(activeUsersCount = 6, databaseConnected = true): ServerStatusInfo {
  const uptimeSeconds = Math.floor((Date.now() - SERVER_CONFIG.startedAt) / 1000);

  return {
    serverName: SERVER_CONFIG.defaultServerName,
    serverDomain: SERVER_CONFIG.serverDomain,
    serverUrl: `https://${SERVER_CONFIG.serverDomain}`,
    clusterNode: SERVER_CONFIG.clusterNode,
    engineVersion: SERVER_CONFIG.engineVersion,
    status: 'ONLINE',
    tlsVersion: SERVER_CONFIG.tlsVersion,
    encryptionStandard: SERVER_CONFIG.encryptionStandard,
    databaseConnected,
    activeUsersCount,
    uptimeSeconds,
    features: {
      offlineSync: true,
      zeroKnowledgeStorage: true,
      roleBasedAccessControl: true,
      twoFactorSupported: true,
      surveyCtoCollectCompatible: true
    }
  };
}

/**
 * Generates SurveyCTO Collect / CMRG Collect Quick Connect bundle
 */
export function generateCollectConfig(user: User, serverUrl = `https://${SERVER_CONFIG.serverDomain}`): CollectQuickConnectConfig {
  const authSecret = getSecret('CMRG_COLLECT_SYNC_SECRET').value;
  const authKey = crypto
    .createHmac('sha256', authSecret)
    .update(`${user.id}:${user.email}:${Date.now()}`)
    .digest('hex')
    .slice(0, 32);

  return {
    serverName: user.serverName || SERVER_CONFIG.defaultServerName,
    serverUrl,
    username: user.email,
    authKey,
    deviceId: user.deviceId || `CMRG-MOBILE-${user.id.slice(-4).toUpperCase()}`,
    configuredAt: new Date().toISOString(),
    appName: 'CMRG Collect',
    engine: 'SurveyCTO v2.92 Compatible Protocol'
  };
}
