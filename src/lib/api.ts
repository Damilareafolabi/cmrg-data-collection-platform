import {
  Project,
  Form,
  FormVersion,
  Deployment,
  Submission,
  User,
  Device,
  AuditLog,
  FormImportResult
} from '../../shared/types';
import { SecretsStatusResponse } from '../../shared/secrets';

export const API_BASE = '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

export const fetchDashboardStats = fetchStats;

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to load projects');
  return res.json();
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create project');
  }
  return res.json();
}

export async function fetchForms(): Promise<Form[]> {
  const res = await fetch(`${API_BASE}/forms`);
  if (!res.ok) throw new Error('Failed to load forms');
  return res.json();
}

export async function fetchForm(id: string): Promise<Form> {
  const res = await fetch(`${API_BASE}/forms/${id}`);
  if (!res.ok) throw new Error('Failed to load form');
  return res.json();
}

export async function createForm(formData: Partial<Form>): Promise<Form> {
  const res = await fetch(`${API_BASE}/forms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create form');
  }
  return res.json();
}

export async function updateForm(id: string, updates: Partial<Form>): Promise<Form> {
  const res = await fetch(`${API_BASE}/forms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to update form');
  }
  return res.json();
}

export async function saveForm(form: Form): Promise<Form> {
  if (form.id) {
    try {
      return await updateForm(form.id, form);
    } catch {
      return await createForm(form);
    }
  }
  return await createForm(form);
}

export async function deleteForm(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/forms/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete form');
  }
}

export async function publishForm(id: string, publishedBy: string, notes?: string): Promise<{ success: boolean; version: FormVersion; form: Form }> {
  const res = await fetch(`${API_BASE}/forms/${id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publishedBy, notes })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to publish form');
  }
  return res.json();
}

export async function importQuestionnaireFile(file: File): Promise<FormImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/import-form`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to parse questionnaire');
  }

  return res.json();
}

export async function fetchDeployments(): Promise<Deployment[]> {
  const res = await fetch(`${API_BASE}/deployments`);
  if (!res.ok) throw new Error('Failed to load deployments');
  return res.json();
}

export async function createDeployment(data: Partial<Deployment>): Promise<Deployment> {
  const res = await fetch(`${API_BASE}/deployments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create deployment');
  return res.json();
}

export const deployForm = createDeployment;

export async function resolveAccessCode(code: string): Promise<{ deployment: Deployment; form: Form }> {
  const res = await fetch(`${API_BASE}/access-codes/${encodeURIComponent(code.trim())}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Invalid access code');
  return body;
}

export async function fetchSubmissions(filters?: { projectId?: string; formId?: string }): Promise<Submission[]> {
  const params = new URLSearchParams();
  if (filters?.projectId) params.set('projectId', filters.projectId);
  if (filters?.formId) params.set('formId', filters.formId);

  const res = await fetch(`${API_BASE}/submissions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load submissions');
  return res.json();
}

export async function syncSubmissions(
  submissions: Submission[],
  deviceId: string,
  enumeratorId: string,
  enumeratorName: string
): Promise<{ success: boolean; syncedCount: number; duplicatesDetected: number; submissions: Submission[] }> {
  const res = await fetch(`${API_BASE}/submissions/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissions, deviceId, enumeratorId, enumeratorName })
  });
  if (!res.ok) throw new Error('Failed to sync submissions');
  return res.json();
}

export async function reviewSubmission(
  id: string,
  reviewer: string,
  status: 'APPROVED' | 'REJECTED' | 'FLAGGED',
  comments: string
): Promise<Submission> {
  const res = await fetch(`${API_BASE}/submissions/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer, status, comments })
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

export async function createUser(userData: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}

export async function fetchDevices(): Promise<Device[]> {
  const res = await fetch(`${API_BASE}/devices`);
  if (!res.ok) throw new Error('Failed to load devices');
  return res.json();
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Failed to load audit logs');
  return res.json();
}

export async function fetchDbStatus(): Promise<{
  mode: 'PostgreSQL' | 'JSON_FILE';
  connected: boolean;
  postgresConfigured: boolean;
  databaseUrlProvided: boolean;
  activeStorage: string;
  schemaVersion: string;
}> {
  const res = await fetch(`${API_BASE}/db/status`);
  if (!res.ok) throw new Error('Failed to fetch database status');
  return res.json();
}

export async function downloadBackup(): Promise<void> {
  const res = await fetch(`${API_BASE}/backup`);
  if (!res.ok) throw new Error('Failed to export backup');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CMRG_Survey_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function restoreBackup(backupData: any): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backupData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to restore backup');
  }
  return res.json();
}

export async function fetchSecretsStatus(): Promise<SecretsStatusResponse> {
  const res = await fetch(`${API_BASE}/secrets/status`);
  if (!res.ok) throw new Error('Failed to fetch secrets status');
  return res.json();
}

export async function downloadVsCodeEnvTemplate(): Promise<void> {
  const res = await fetch(`${API_BASE}/secrets/env-template?download=true`);
  if (!res.ok) throw new Error('Failed to download VS Code .env template');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '.env.cmrg-vscode';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ==================== SECURE SERVER AUTHENTICATION ====================
export interface ServerLoginPayload {
  email: string;
  password?: string;
  serverName?: string;
}

export interface ServerRegisterPayload {
  name: string;
  email: string;
  username?: string;
  password?: string;
  organizationName?: string;
  serverName?: string;
  role?: string;
  phoneNumber?: string;
}

export async function loginServer(payload: ServerLoginPayload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw {
      message: data.error || 'Authentication failed',
      status: res.status,
      remainingSeconds: data.remainingSeconds,
      locked: data.locked,
      attemptsLeft: data.attemptsLeft
    };
  }
  if (data.token) {
    localStorage.setItem('cmrg_auth_token', data.token);
    localStorage.setItem('cmrg_server_name', payload.serverName || 'cmrg');
  }
  return data;
}

export async function registerServer(payload: ServerRegisterPayload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  if (data.token) {
    localStorage.setItem('cmrg_auth_token', data.token);
    localStorage.setItem('cmrg_server_name', payload.serverName || 'cmrg');
  }
  return data;
}

export async function logoutServer() {
  try {
    const token = localStorage.getItem('cmrg_auth_token');
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  } catch (err) {
    console.warn('Logout notification error:', err);
  } finally {
    localStorage.removeItem('cmrg_auth_token');
  }
}

export async function fetchServerStatus() {
  const res = await fetch(`${API_BASE}/auth/server-status`);
  if (!res.ok) throw new Error('Failed to fetch server status');
  return res.json();
}

export async function fetchCollectQuickConfig(serverUrl?: string) {
  const token = localStorage.getItem('cmrg_auth_token');
  const query = serverUrl ? `?serverUrl=${encodeURIComponent(serverUrl)}` : '';
  const res = await fetch(`${API_BASE}/auth/collect-config${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to load mobile collect configuration');
  return res.json();
}

