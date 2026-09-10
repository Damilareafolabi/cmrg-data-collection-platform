import { SecretItem, SecretsStatusResponse } from '../shared/secrets';

// Simulated secret values for sandbox / development before moving to VS Code
export const SIMULATED_SECRETS = {
  AUTH_SECRET: 'cmrg_simulated_auth_secret_dev_e94c8b21a0f5d762_temp_until_vscode',
  DATABASE_URL: 'postgresql://cmrg_admin:simulated_db_pass_2026@localhost:5432/cmrg_survey_dev',
  CMRG_COLLECT_SYNC_SECRET: 'cmrg_collect_sync_simulated_secret_v24_offline',
  STORAGE_SECRET_KEY: 'cmrg_simulated_aes256_storage_secret_key_dev',
  GEMINI_API_KEY: 'AIzaSySimulated_Gemini_Key_CMRG_Dev_Sandbox_2026',
  ADMIN_INITIAL_PASSWORD: 'CMRG_Dev_Admin_Pass_2026!'
};

/**
 * Mask a secret string for safe display in UI and logs
 */
export function maskSecret(val: string): string {
  if (!val || val.length < 8) return '••••••••';
  return `${val.slice(0, 4)}••••••••${val.slice(-4)}`;
}

/**
 * Retrieves a secret value, falling back to a safe simulated value
 * if not defined in process.env.
 */
export function getSecret(key: keyof typeof SIMULATED_SECRETS | string): { value: string; isSimulated: boolean } {
  const envVal = process.env[key];
  if (envVal && envVal.trim() !== '' && !envVal.startsWith('replace_with_') && !envVal.includes('simulated')) {
    return {
      value: envVal,
      isSimulated: false
    };
  }

  const simulated = (SIMULATED_SECRETS as Record<string, string>)[key] || `simulated_val_${key.toLowerCase()}_dev`;
  return {
    value: simulated,
    isSimulated: true
  };
}

/**
 * Returns the status of all secrets in the system
 */
export function getSecretsStatus(): SecretsStatusResponse {
  const definitions: Array<{
    key: keyof typeof SIMULATED_SECRETS;
    category: 'SECURITY' | 'DATABASE' | 'MOBILE' | 'STORAGE' | 'AI';
    description: string;
    targetPurpose: string;
    recommendationForVsCode: string;
  }> = [
    {
      key: 'AUTH_SECRET',
      category: 'SECURITY',
      description: 'HMAC / JWT session signature secret for tokens',
      targetPurpose: 'Verifies user session authenticity between Web, Backend, and CMRG Collect',
      recommendationForVsCode: 'Generate a 64-character high-entropy random string (e.g. openssl rand -hex 32)'
    },
    {
      key: 'DATABASE_URL',
      category: 'DATABASE',
      description: 'PostgreSQL connection string with credentials',
      targetPurpose: 'Connects to enterprise PostgreSQL 15+ cluster (AWS RDS, GCP Cloud SQL, or Neon)',
      recommendationForVsCode: 'Provide real PostgreSQL connection URL (or leave blank to keep resilient JSON/SQLite store)'
    },
    {
      key: 'CMRG_COLLECT_SYNC_SECRET',
      category: 'MOBILE',
      description: 'Field device synchronization API signature key',
      targetPurpose: 'Authenticates offline tablet & mobile sync packets from CMRG Collect field app',
      recommendationForVsCode: 'Set a private shared token known only to CMRG field supervisor devices'
    },
    {
      key: 'STORAGE_SECRET_KEY',
      category: 'STORAGE',
      description: 'AES-256 encryption key for media & audio interview attachments',
      targetPurpose: 'Encrypts respondent photos, GPS tracks, and audio recordings before storage',
      recommendationForVsCode: 'Set a 32-byte AES key for encrypted respondent media archive'
    },
    {
      key: 'GEMINI_API_KEY',
      category: 'AI',
      description: 'Google Gemini API key for smart questionnaire generation & QA assistance',
      targetPurpose: 'Powers automatic codebook categorization and validation assistance',
      recommendationForVsCode: 'Obtain from Google AI Studio (https://aistudio.google.com)'
    },
    {
      key: 'ADMIN_INITIAL_PASSWORD',
      category: 'SECURITY',
      description: 'Default master bootstrap administrator password',
      targetPurpose: 'Initial super-admin bootstrap credential for Dr. Amina Bello',
      recommendationForVsCode: 'Set a unique enterprise administrator password before initial launch'
    }
  ];

  let hasAnyReal = false;

  const secrets: SecretItem[] = definitions.map(def => {
    const { value, isSimulated } = getSecret(def.key);
    if (!isSimulated) hasAnyReal = true;

    return {
      key: def.key,
      category: def.category,
      description: def.description,
      isSimulated,
      maskedValue: maskSecret(value),
      targetPurpose: def.targetPurpose,
      recommendationForVsCode: def.recommendationForVsCode
    };
  });

  const vsCodeEnvTemplate = generateVsCodeEnvTemplate();

  return {
    allSimulated: !hasAnyReal,
    environmentMode: hasAnyReal ? 'PRODUCTION' : 'SIMULATED_SANDBOX',
    notice: 'Secret values are actively simulated in this development sandbox. Real production values can be configured once exported to VS Code.',
    secrets,
    vsCodeEnvTemplate
  };
}

/**
 * Generates the ready-to-use production .env template for VS Code
 */
export function generateVsCodeEnvTemplate(): string {
  return `# ==============================================================================
# CMRG Survey — Production Environment Configuration for VS Code
# Owner: Consumer & Market Research Group Ltd. (CMRG Ltd. RC378525)
# Developers: Afolabi Oluwadamilare Simeon & Samuel Korede
# ==============================================================================
# INSTRUCTIONS FOR VS CODE:
# Replace the placeholder values below with your real production credentials.
# In the AI Studio sandbox, these values were automatically simulated.
# ==============================================================================

NODE_ENV=production
PORT=3000

# ------------------------------------------------------------------------------
# 1. DATABASE CONFIGURATION (PostgreSQL 15+)
# ------------------------------------------------------------------------------
# Set this to your live PostgreSQL connection string:
DATABASE_URL=postgresql://cmrg_admin:REPLACE_WITH_REAL_PG_PASSWORD@localhost:5432/cmrg_survey_prod?sslmode=require

# ------------------------------------------------------------------------------
# 2. APPLICATION SECURITY & AUTHENTICATION SECRETS
# ------------------------------------------------------------------------------
# Strong 64-character secret for signing JWT sessions (generate with: openssl rand -hex 32)
AUTH_SECRET=REPLACE_WITH_AT_LEAST_32_CHAR_RANDOM_SECRET_KEY

# Initial super-admin password for initial system bootstrap
ADMIN_INITIAL_PASSWORD=REPLACE_WITH_STRONG_ADMIN_PASSWORD_2026!

# ------------------------------------------------------------------------------
# 3. CMRG COLLECT (MOBILE FIELD APP) SYNC CREDENTIALS
# ------------------------------------------------------------------------------
# Shared signature secret between CMRG Collect Android client and backend API
CMRG_COLLECT_SYNC_SECRET=REPLACE_WITH_SECURE_MOBILE_SYNC_TOKEN

# ------------------------------------------------------------------------------
# 4. STORAGE & MEDIA ENCRYPTION
# ------------------------------------------------------------------------------
# AES-256 key for encrypting media attachments (photos, audio notes)
STORAGE_SECRET_KEY=REPLACE_WITH_32_BYTE_AES_ENCRYPTION_KEY
STORAGE_PROVIDER=local

# ------------------------------------------------------------------------------
# 5. OPTIONAL AI ASSISTANCE (Google Gemini API)
# ------------------------------------------------------------------------------
# Obtain key from Google AI Studio: https://aistudio.google.com
GEMINI_API_KEY=REPLACE_WITH_REAL_GEMINI_API_KEY
`;
}
