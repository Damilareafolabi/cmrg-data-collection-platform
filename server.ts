import express from 'express';
import { randomBytes } from 'crypto';
import path from 'path';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';
import { db } from './backend/db';
import { processUploadedQuestionnaire } from './backend/importers';
import { buildOdkXform } from './backend/odkXform';
import { Submission, Form, UserRole, User } from './shared/types';
import { getDatabaseStatus } from './database/db_client';
import { getSecretsStatus, generateVsCodeEnvTemplate, getSecret } from './backend/simulatedSecrets';
import {
  SERVER_CONFIG,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  generateSalt,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  createSessionToken,
  verifySessionToken,
  getServerStatus,
  generateCollectConfig
} from './backend/authService';

const app = express();
const PORT = 3000;

// Increase payload limits for attachments and offline sync queues
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload setup in memory for questionnaire imports and media
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB
});

// Helper for role-based authorization check
function getAuthUser(req: express.Request): User | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const verified = verifySessionToken(token);
    if (verified.valid && verified.payload?.uid) {
      const found = db.findUser(verified.payload.uid);
      if (found) return found;
    }
    // Token format fallback: usr_<userId> or user email
    const users = db.getUsers();
    const fallback = users.find(u => u.id === token || u.email === token || `token_${u.id}` === token || token.includes(u.id));
    if (fallback) return fallback;
  }
  // Default to first active admin or project manager if no header provided
  const roleHeader = req.headers['x-user-role'] as string;
  if (roleHeader) {
    return db.getUsers().find(u => u.role === roleHeader);
  }
  return db.getUsers().find(u => u.role === 'ADMIN');
}

// ==================== REST API ROUTES ====================

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'CMRG Survey Platform',
    mobileApp: 'CMRG Collect',
    version: '2.4.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db/status', (req, res) => {
  res.json(getDatabaseStatus());
});

// Secrets Status & VS Code Handoff Configuration
app.get('/api/secrets/status', (req, res) => {
  try {
    const status = getSecretsStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/secrets/env-template', (req, res) => {
  try {
    const template = generateVsCodeEnvTemplate();
    const isDownload = req.query.download === 'true';
    if (isDownload) {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=".env.cmrg-vscode"');
      return res.send(template);
    }
    res.type('text/plain').send(template);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== AUTHENTICATION & SESSIONS ====================
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, serverName } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const rateKey = `${clientIp}:${(email || 'anon').toLowerCase()}`;

    // 1. Rate limiting & brute force lockout check
    const rateCheck = checkRateLimit(rateKey);
    if (rateCheck.isLocked) {
      return res.status(429).json({
        error: `Server lockout: Too many failed login attempts. Retry in ${rateCheck.remainingSeconds} seconds.`,
        remainingSeconds: rateCheck.remainingSeconds,
        locked: true
      });
    }

    if (!email) {
      return res.status(400).json({ error: 'Username, email address, or User ID is required' });
    }

    const cleanIdentifier = email.toLowerCase().trim();
    const user = db.findUser(cleanIdentifier);

    if (!user) {
      const fail = recordFailedAttempt(rateKey);
      return res.status(401).json({
        error: 'Authentication failed: No user account found on this server.',
        attemptsLeft: fail.attemptsLeft,
        isLocked: fail.isLocked,
        remainingSeconds: fail.remainingSeconds
      });
    }

    // 2. Password verification (if password provided)
    if (user.passwordHash && user.passwordSalt && password) {
      const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        const fail = recordFailedAttempt(rateKey);
        return res.status(401).json({
          error: 'Authentication failed: Incorrect password.',
          attemptsLeft: fail.attemptsLeft,
          isLocked: fail.isLocked,
          remainingSeconds: fail.remainingSeconds
        });
      }
    }

    // Reset rate limiter on successful authentication
    clearRateLimit(rateKey);

    const srv = (serverName && typeof serverName === 'string' && serverName.trim()) ? serverName.trim() : SERVER_CONFIG.defaultServerName;
    user.lastLogin = new Date().toISOString();
    user.serverName = srv;

    db.logAudit(user.name, 'USER_LOGIN', user.role, `Logged in to server [${srv}] via ${req.headers['user-agent']?.includes('Dart') ? 'CMRG Collect Android' : 'CMRG Survey Web'}`);

    // Generate secure cryptographic session token
    const token = createSessionToken(user, srv);

    res.json({
      success: true,
      user,
      token,
      serverInfo: {
        serverName: srv,
        serverUrl: `https://${srv.toLowerCase()}.${SERVER_CONFIG.serverDomain}`,
        node: SERVER_CONFIG.clusterNode
      },
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Secure Registration / New User Sign Up
app.post(['/api/auth/register', '/api/auth/signup'], (req, res) => {
  try {
    const { name, email, username, password, organizationName, serverName, role, phoneNumber } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Full name and email address are required to register.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.findUser(cleanEmail);

    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists on this server.' });
    }

    if (password) {
      const strength = validatePasswordStrength(password);
      if (!strength.valid) {
        return res.status(400).json({ error: strength.message });
      }
    }

    const salt = generateSalt();
    const pHash = password ? hashPassword(password, salt) : undefined;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const srv = (serverName && typeof serverName === 'string' && serverName.trim()) ? serverName.trim() : SERVER_CONFIG.defaultServerName;

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      username: username ? username.trim() : cleanEmail.split('@')[0],
      role: (role as UserRole) || 'ENUMERATOR',
      status: 'ACTIVE',
      organizationName: organizationName || 'CMRG Ltd.',
      serverName: srv,
      phoneNumber,
      passwordHash: pHash,
      passwordSalt: salt,
      authMethod: 'PASSWORD',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    db.addUser(newUser);
    db.logAudit(newUser.name, 'USER_REGISTERED', newUser.role, `Registered account on server [${srv}] for organization ${newUser.organizationName}`);

    const token = createSessionToken(newUser, srv);

    res.status(201).json({
      success: true,
      user: newUser,
      token,
      serverInfo: {
        serverName: srv,
        serverUrl: `https://${srv.toLowerCase()}.${SERVER_CONFIG.serverDomain}`,
        node: SERVER_CONFIG.clusterNode
      },
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const user = getAuthUser(req);
  if (user) {
    db.logAudit(user.name, 'USER_LOGOUT', user.role, 'User session terminated');
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/server-status', (req, res) => {
  const activeCount = db.getUsers().filter(u => u.status === 'ACTIVE').length;
  const dbStatus = getDatabaseStatus();
  res.json(getServerStatus(activeCount, dbStatus.connected));
});

app.get('/api/auth/collect-config', (req, res) => {
  const user = getAuthUser(req) || db.getUsers().find(u => u.role === 'ADMIN');
  if (!user) return res.status(404).json({ error: 'User not found' });
  const serverUrl = (req.query.serverUrl as string) || `https://${SERVER_CONFIG.serverDomain}`;
  res.json(generateCollectConfig(user, serverUrl));
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(user);
});

// Backup & Restore
app.get('/api/backup', (req, res) => {
  try {
    const user = getAuthUser(req);
    if (user && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: only ADMIN can download complete system backup' });
    }
    const backup = db.exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="CMRG_Survey_Backup_${Date.now()}.json"`);
    res.json(backup);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/restore', (req, res) => {
  try {
    const user = getAuthUser(req);
    if (user && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: only ADMIN can restore system backup' });
    }
    const result = db.restoreBackup(req.body, user?.name || 'Admin');
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Dashboard Statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Users
app.get('/api/users', (req, res) => {
  res.json(db.getUsers());
});

app.post('/api/users', (req, res) => {
  try {
    const newUser = req.body;
    if (!newUser.name || !newUser.role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }
    const created = db.addUser({
      id: `user_${Date.now()}`,
      name: newUser.name,
      email: newUser.email || `${newUser.name.toLowerCase().replace(/\s+/g, '.')}@cmrg.org`,
      role: newUser.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Projects
app.get('/api/projects', (req, res) => {
  res.json(db.getProjects());
});

app.get('/api/projects/:id', (req, res) => {
  const p = db.getProject(req.params.id);
  if (!p) return res.status(404).json({ error: 'Project not found' });
  res.json(p);
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, description, client, startDate, endDate, createdBy } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const newProj = db.createProject({
      id: `proj_${Date.now()}`,
      name,
      description: description || '',
      client: client || 'CMRG Internal Research',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      status: 'ACTIVE',
      createdBy: createdBy || 'Dr. Amina Bello',
      createdDate: new Date().toISOString()
    });
    res.json(newProj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', (req, res) => {
  const updated = db.updateProject(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Project not found' });
  res.json(updated);
});

// Forms
app.get('/api/forms', (req, res) => {
  res.json(db.getForms());
});

app.get('/api/forms/:id', (req, res) => {
  const f = db.getForm(req.params.id);
  if (!f) return res.status(404).json({ error: 'Form not found' });
  res.json(f);
});

app.post('/api/forms', (req, res) => {
  try {
    const formInput = req.body;
    if (!formInput.title) return res.status(400).json({ error: 'Form title is required' });

    const newForm: Form = {
      id: formInput.id || `form_${Date.now()}`,
      projectId: formInput.projectId || 'proj_cmrg_household',
      projectName: formInput.projectName,
      title: formInput.title,
      description: formInput.description || '',
      status: formInput.status || 'DRAFT',
      currentVersion: 0,
      questions: formInput.questions || [],
      settings: formInput.settings || {
        formTitle: formInput.title,
        formId: `form_${Date.now()}`,
        defaultLanguage: 'English',
        allowDrafts: true,
        requireGps: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const created = db.createForm(newForm, req.body.author || 'Admin');
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/forms/:id', (req, res) => {
  const updated = db.updateForm(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Form not found' });
  res.json(updated);
});

app.post('/api/forms/:id/publish', (req, res) => {
  try {
    const { publishedBy, notes } = req.body;
    const version = db.publishForm(req.params.id, publishedBy || 'Dr. Amina Bello', notes);
    res.json({ success: true, version, form: db.getForm(req.params.id) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/forms/:id/versions', (req, res) => {
  res.json(db.getFormVersions(req.params.id));
});

// ODK Collect proof-of-concept download format for a published CMRG form.
app.get('/api/forms/:id/xform.xml', (req, res) => {
  const form = db.getForm(req.params.id);
  if (!form) return res.status(404).send('Form not found');
  if (form.status !== 'PUBLISHED' || !form.currentVersionId) {
    return res.status(409).send('Only published forms have an ODK XForm package');
  }
  const version = db.getFormVersions(form.id).find(item => item.id === form.currentVersionId);
  if (!version) return res.status(404).send('Published form version not found');
  res.type('application/xml').send(buildOdkXform(form, version));
});

// ==================== QUESTIONNAIRE IMPORT API ====================
// Supports multipart/form-data upload or JSON payload with base64/content
app.post('/api/import-form', upload.single('file') as any, (req, res) => {
  try {
    let fileBuffer: Buffer;
    let fileName: string;
    let mimetype: string | undefined;

    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;
      mimetype = req.file.mimetype;
    } else if (req.body.base64Content && req.body.fileName) {
      fileBuffer = Buffer.from(req.body.base64Content, 'base64');
      fileName = req.body.fileName;
      mimetype = req.body.mimetype;
    } else if (req.body.rawContent && req.body.fileName) {
      fileBuffer = Buffer.from(req.body.rawContent, 'utf-8');
      fileName = req.body.fileName;
    } else {
      return res.status(400).json({
        error: 'No file uploaded. Please upload a file via multipart form-data or provide base64Content.'
      });
    }

    const result = processUploadedQuestionnaire(fileBuffer, fileName, mimetype);
    db.logAudit(
      req.body.importedBy || 'Admin',
      'QUESTIONNAIRE_IMPORTED',
      fileName,
      `Imported ${result.fileType} "${fileName}" with ${result.questionsCount} questions detected`
    );

    res.json(result);
  } catch (err: any) {
    console.error('Import form error:', err);
    res.status(500).json({
      error: `Failed to import questionnaire: ${err.message || 'Invalid format'}`
    });
  }
});

// Deployments
app.get('/api/deployments', (req, res) => {
  res.json(db.getDeployments());
});

app.post('/api/deployments', (req, res) => {
  try {
    const dep = req.body;
    if (!dep.formId) return res.status(400).json({ error: 'formId is required' });

    const created = db.createDeployment({
      id: `dep_${Date.now()}`,
      projectId: dep.projectId || 'proj_cmrg_household',
      formId: dep.formId,
      formVersionId: dep.formVersionId || 'ver_1',
      versionNumber: dep.versionNumber || 1,
      formTitle: dep.formTitle || 'Survey Form',
      targetType: dep.targetType || 'ALL',
      assignedToUserId: dep.assignedToUserId,
      assignedToUserName: dep.assignedToUserName,
      accessCode: dep.accessCode || randomBytes(5).toString('hex').toUpperCase(),
      status: 'ACTIVE',
      deployedAt: new Date().toISOString()
    }, req.body.author || 'Admin');

    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Interviewer access-code lookup. The code exposes only the active deployment's
// published questionnaire; it does not grant supervisor access to the platform.
app.get('/api/access-codes/:code', (req, res) => {
  const normalizedCode = req.params.code.trim().toUpperCase();
  const deployment = db.getDeployments().find(item =>
    item.accessCode === normalizedCode &&
    item.status === 'ACTIVE' &&
    (!item.expiresAt || new Date(item.expiresAt).getTime() > Date.now())
  );
  if (!deployment) return res.status(404).json({ error: 'Access code is invalid or expired' });

  const form = db.getForm(deployment.formId);
  if (!form || form.status !== 'PUBLISHED' || form.currentVersionId !== deployment.formVersionId) {
    return res.status(409).json({ error: 'The questionnaire is not currently published for this deployment' });
  }
  res.json({
    deployment: {
      id: deployment.id,
      formId: deployment.formId,
      formVersionId: deployment.formVersionId,
      formTitle: deployment.formTitle,
      versionNumber: deployment.versionNumber,
      assignedToUserId: deployment.assignedToUserId
    },
    form
  });
});

// ==================== SUBMISSIONS & SYNC API ====================
app.get('/api/submissions', (req, res) => {
  const { projectId, formId, enumeratorId } = req.query;
  const list = db.getSubmissions({
    projectId: projectId as string,
    formId: formId as string,
    enumeratorId: enumeratorId as string
  });
  res.json(list);
});

app.get('/api/submissions/:id', (req, res) => {
  const s = db.getSubmission(req.params.id);
  if (!s) return res.status(404).json({ error: 'Submission not found' });
  res.json(s);
});

// Idempotent Sync Endpoint for Offline Collection
app.post('/api/submissions/sync', (req, res) => {
  try {
    const { submissions, deviceId, enumeratorId, enumeratorName } = req.body;
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.status(400).json({ error: 'No submissions array provided' });
    }

    // Update device active status
    if (deviceId) {
      db.updateDeviceSync(deviceId, enumeratorId || 'user_anon', enumeratorName || 'Enumerator');
    }

    const { synced, duplicates } = db.syncSubmissions(submissions);

    res.json({
      success: true,
      syncedCount: synced.length,
      duplicatesDetected: duplicates,
      submissions: synced
    });
  } catch (err: any) {
    console.error('Sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Supervisor Review
app.post('/api/submissions/:id/review', (req, res) => {
  try {
    const { reviewer, status, comments } = req.body;
    if (!['APPROVED', 'REJECTED', 'FLAGGED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid review status' });
    }
    const updated = db.reviewSubmission(
      req.params.id,
      reviewer || 'Supervisor',
      status,
      comments || ''
    );
    if (!updated) return res.status(404).json({ error: 'Submission not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== REAL DATA EXPORT (CSV / XLSX) ====================
app.get('/api/export/:format', (req, res) => {
  try {
    const format = req.params.format.toLowerCase();
    const { formId } = req.query;

    const submissions = db.getSubmissions({ formId: formId as string });
    if (submissions.length === 0) {
      return res.status(400).json({ error: 'No submissions found to export' });
    }

    // Build flattened table
    const rows = submissions.map(sub => {
      const flat: Record<string, any> = {
        'Submission ID': sub.id,
        'Client UUID': sub.clientSubmissionId,
        'Project': sub.projectName || sub.projectId,
        'Form Title': sub.formTitle || sub.formId,
        'Form Version': `v${sub.versionNumber}.0`,
        'Enumerator ID': sub.enumeratorId,
        'Enumerator Name': sub.enumeratorName,
        'Device ID': sub.deviceId,
        'Submitted At': sub.submittedAt,
        'Review Status': sub.status,
        'GPS Latitude': sub.geolocation?.latitude ?? '',
        'GPS Longitude': sub.geolocation?.longitude ?? '',
        'GPS Accuracy (m)': sub.geolocation?.accuracy ?? '',
      };

      // Add all answered variables
      if (sub.answers && typeof sub.answers === 'object') {
        for (const [key, val] of Object.entries(sub.answers)) {
          flat[key] = Array.isArray(val)
            ? val.join(', ')
            : (val && typeof val === 'object' ? JSON.stringify(val) : (val ?? ''));
        }
      }

      if (sub.review) {
        flat['Reviewed By'] = sub.review.reviewedBy;
        flat['Review Notes'] = sub.review.comments;
        flat['Reviewed At'] = sub.review.reviewedAt;
      }

      return flat;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

    // Also build a second sheet with Metadata & Question Dictionary if form exists
    const form = formId ? db.getForm(formId as string) : db.getForms()[0];
    if (form) {
      const codebookRows = form.questions.map(q => ({
        'Variable Name': q.name,
        'Label': q.label,
        'Type': q.type,
        'Required': q.required ? 'YES' : 'NO',
        'Relevance Logic': q.relevant || 'Always',
        'Constraint': q.constraint || '',
        'Calculation': q.calculation || '',
        'Choices': q.choices?.map(c => `${c.value}=${c.label}`).join('; ') || ''
      }));
      const codebookSheet = XLSX.utils.json_to_sheet(codebookRows);
      XLSX.utils.book_append_sheet(workbook, codebookSheet, 'Codebook');
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `CMRG_Submissions_Export_${timestamp}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.json({
        exportDate: new Date().toISOString(),
        formTitle: form?.title || 'CMRG Survey',
        totalRecords: submissions.length,
        submissions,
        codebook: form ? form.questions : []
      });
    } else if (format === 'csv') {
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csvData);
    } else {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.send(buffer);
    }
  } catch (err: any) {
    console.error('Export error:', err);
    res.status(500).json({ error: `Export failed: ${err.message}` });
  }
});

// Media attachment upload for mobile GPS/photos/audio
app.post('/api/submissions/media', upload.single('media') as any, (req, res) => {
  try {
    const { submissionId, questionName, fileName } = req.body;
    let fileData = '';
    let size = 0;

    if (req.file) {
      fileData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      size = req.file.size;
    } else if (req.body.dataUrl) {
      fileData = req.body.dataUrl;
      size = req.body.dataUrl.length;
    }

    const attachment = {
      id: `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      questionName: questionName || 'media_attachment',
      fileName: fileName || req.file?.originalname || 'attachment.dat',
      fileType: req.file?.mimetype || 'application/octet-stream',
      fileSize: size,
      dataUrl: fileData,
      uploadedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      attachment
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to process media upload: ${err.message}` });
  }
});

// Devices
app.get('/api/devices', (req, res) => {
  res.json(db.getDevices());
});

// Audit Logs
app.get('/api/audit-logs', (req, res) => {
  res.json(db.getAuditLogs());
});

// ==================== VITE MIDDLEWARE & SERVER START ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CMRG Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
