export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'SUPERVISOR' | 'ENUMERATOR' | 'DATA_ANALYST';

export interface Organization {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  country: string;
  createdAt: string;
}

export interface User {
  id: string;
  organizationId?: string;
  organizationName?: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  lastLogin?: string;
  assignedProjectIds?: string[];
  deviceId?: string;
  serverName?: string;
  phoneNumber?: string;
  passwordHash?: string;
  passwordSalt?: string;
  authMethod?: 'PASSWORD' | 'SESSION_TOKEN' | 'DEVICE_KEY';
}

export interface ServerStatusInfo {
  serverName: string;
  serverDomain: string;
  serverUrl: string;
  clusterNode: string;
  engineVersion: string;
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE';
  tlsVersion: string;
  encryptionStandard: string;
  databaseConnected: boolean;
  activeUsersCount: number;
  uptimeSeconds: number;
  features: {
    offlineSync: boolean;
    zeroKnowledgeStorage: boolean;
    roleBasedAccessControl: boolean;
    twoFactorSupported: boolean;
    surveyCtoCollectCompatible: boolean;
  };
}

export interface AuthSessionResponse {
  success: boolean;
  user: User;
  token: string;
  serverInfo: {
    serverName: string;
    serverUrl: string;
    node: string;
  };
  expiresAt: string;
  message?: string;
}

export interface CollectQuickConnectConfig {
  serverName: string;
  serverUrl: string;
  username: string;
  authKey: string;
  deviceId?: string;
  configuredAt: string;
  appName: string;
  engine: string;
}

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Project {
  id: string;
  organizationId?: string;
  name: string;
  description: string;
  client: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  createdBy: string;
  createdDate: string;
  formCount?: number;
  submissionCount?: number;
}

export type QuestionType =
  | 'text'
  | 'long_text'
  | 'note'
  | 'integer'
  | 'decimal'
  | 'select_one'
  | 'select_multiple'
  | 'dropdown'
  | 'yes_no'
  | 'date'
  | 'time'
  | 'datetime'
  | 'calculate'
  | 'geopoint'
  | 'image'
  | 'audio'
  | 'signature'
  | 'rating'
  | 'ranking'
  | 'begin_group'
  | 'end_group'
  | 'begin_repeat'
  | 'end_repeat';

export interface ChoiceOption {
  value: string;
  label: string;
  filterCategory?: string;
}

export interface Question {
  id: string;
  name: string; // Unique variable name, e.g. "age", "owns_phone"
  label: string;
  hint?: string;
  type: QuestionType;
  required: boolean;
  readOnly?: boolean;
  defaultValue?: any;
  choices?: ChoiceOption[];
  choiceListName?: string;
  relevant?: string; // Skip logic expression e.g. "${owns_phone} = 'yes'"
  constraint?: string; // e.g. ". >= 0 and . <= 120" or structured formula
  constraintMessage?: string;
  calculation?: string; // e.g. "${data_spend} * 12"
  appearance?: string; // "horizontal", "multiline", "minimal"
  maxRating?: number; // E.g. 5 or 10 for rating type
  order: number;
  groupId?: string;
  repeatId?: string;
  sectionTitle?: string;
}

export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface FormVersion {
  id: string;
  formId: string;
  versionNumber: number;
  versionTag: string; // e.g. "v1.0"
  publishedAt: string;
  publishedBy: string;
  questions: Question[];
  settings: Record<string, any>;
  notes?: string;
}

export interface Form {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string;
  status: FormStatus;
  currentVersion: number;
  currentVersionId?: string;
  questions: Question[];
  settings: {
    formTitle: string;
    formId: string;
    defaultLanguage: string;
    allowDrafts: boolean;
    requireGps: boolean;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  submissionsCount?: number;
}

export interface Deployment {
  id: string;
  projectId: string;
  formId: string;
  formVersionId: string;
  versionNumber: number;
  formTitle: string;
  targetType: 'ENUMERATOR' | 'TEAM' | 'ALL';
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedToTeam?: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  accessCode?: string;
  deployedAt: string;
  expiresAt?: string;
}

export type SubmissionStatus =
  | 'DRAFT'
  | 'COMPLETED'
  | 'QUEUED'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'FLAGGED';

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp: string;
}

export interface AttachmentMetadata {
  id: string;
  questionName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url?: string;
  dataUrl?: string; // Base64 for offline sync
  uploadedAt: string;
}

export interface Submission {
  id: string; // Server ID
  clientSubmissionId: string; // Unique client-generated UUID for idempotency
  projectId: string;
  projectName?: string;
  formId: string;
  formTitle?: string;
  formVersionId: string;
  versionNumber: number;
  enumeratorId: string;
  enumeratorName: string;
  deviceId: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string;
  status: SubmissionStatus;
  syncStatus: 'OFFLINE_SAVED' | 'QUEUED' | 'SYNCED' | 'SYNC_FAILED';
  answers: Record<string, any>; // Keyed by question.name
  repeatData?: Record<string, Record<string, any>[]>; // For repeat groups
  geolocation?: GeoLocationData;
  attachments?: AttachmentMetadata[];
  review?: {
    reviewedBy: string;
    reviewedAt: string;
    status: 'APPROVED' | 'REJECTED' | 'FLAGGED';
    comments: string;
  };
}

export interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  assignedUserId: string;
  assignedUserName: string;
  appVersion: string;
  lastSyncAt: string;
  pendingSubmissionsCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'NEEDS_SYNC';
  deviceModel?: string;
  osVersion?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
}

export interface ImportWarning {
  questionIndex?: number;
  questionName?: string;
  severity: 'warning' | 'error' | 'info';
  message: string;
  suggestedFix?: string;
}

export interface FormImportResult {
  fileName: string;
  fileType: 'XLSForm' | 'Excel Questionnaire' | 'CSV' | 'TSV' | 'JSON' | 'XML' | 'Word' | 'PDF' | 'Text';
  detectedFormTitle: string;
  questionsCount: number;
  sectionsCount: number;
  choiceListsCount: number;
  skipConditionsCount: number;
  calculationsCount: number;
  questions: Question[];
  warnings: ImportWarning[];
  rawSummary?: Record<string, any>;
}

export interface DashboardStats {
  totalProjects: number;
  totalForms: number;
  publishedForms: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  activeEnumerators: number;
  pendingSyncSubmissions: number;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface DatabaseBackup {
  version: string;
  exportedAt: string;
  checksum: string;
  recordCounts: Record<string, number>;
  data: {
    organizations?: Organization[];
    users: User[];
    projects: Project[];
    forms: Form[];
    formVersions: FormVersion[];
    deployments: Deployment[];
    submissions: Submission[];
    devices: Device[];
    auditLogs: AuditLog[];
  };
}
