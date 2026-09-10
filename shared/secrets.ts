export interface SecretItem {
  key: string;
  category: 'SECURITY' | 'DATABASE' | 'MOBILE' | 'STORAGE' | 'AI';
  description: string;
  isSimulated: boolean;
  maskedValue: string;
  targetPurpose: string;
  recommendationForVsCode: string;
}

export interface SecretsStatusResponse {
  allSimulated: boolean;
  environmentMode: 'SIMULATED_SANDBOX' | 'PRODUCTION';
  notice: string;
  secrets: SecretItem[];
  vsCodeEnvTemplate: string;
}
