import fs from 'fs';
import path from 'path';
import {
  User,
  Project,
  Form,
  FormVersion,
  Deployment,
  Submission,
  Device,
  AuditLog
} from '../shared/types';

const DB_FILE_PATH = path.resolve(process.cwd(), 'cmrg_database.json');

export interface CMRGDatabase {
  users: User[];
  projects: Project[];
  forms: Form[];
  formVersions: FormVersion[];
  deployments: Deployment[];
  submissions: Submission[];
  devices: Device[];
  auditLogs: AuditLog[];
}

function getInitialDatabase(): CMRGDatabase {
  const adminUser: User = {
    id: 'user_admin_1',
    name: 'Dr. Amina Bello',
    email: 'amina.bello@cmrg.org',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastLogin: new Date().toISOString()
  };

  const projectManagerUser: User = {
    id: 'user_pm_1',
    name: 'Emeka Nwosu',
    email: 'emeka.nwosu@cmrg.org',
    role: 'PROJECT_MANAGER',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 1800000).toISOString()
  };

  const supervisorUser: User = {
    id: 'user_sup_1',
    name: 'Chidi Okafor',
    email: 'chidi.okafor@cmrg.org',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 3600000).toISOString()
  };

  const dataAnalystUser: User = {
    id: 'user_analyst_1',
    name: 'Zainab Haruna',
    email: 'zainab.haruna@cmrg.org',
    role: 'DATA_ANALYST',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 5400000).toISOString()
  };

  const enumerator1: User = {
    id: 'user_enum_1',
    name: 'Tunde Adebayo',
    email: 'tunde.adebayo@cmrg.org',
    role: 'ENUMERATOR',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
    deviceId: 'DEV-CMRG-8821'
  };

  const enumerator2: User = {
    id: 'user_enum_2',
    name: 'Fatima Yusuf',
    email: 'fatima.yusuf@cmrg.org',
    role: 'ENUMERATOR',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 1800000).toISOString(),
    deviceId: 'DEV-CMRG-9943'
  };

  const sampleProjectId = 'proj_cmrg_household';
  const sampleProject: Project = {
    id: sampleProjectId,
    name: 'CMRG National Socioeconomic & Tech Survey 2026',
    description: 'A comprehensive national study assessing household living conditions, digital inclusion, and telecom adoption.',
    client: 'Federal Ministry of Communications & Digital Economy',
    startDate: '2026-02-01',
    endDate: '2026-11-30',
    status: 'ACTIVE',
    createdBy: adminUser.name,
    createdDate: new Date(Date.now() - 25 * 86400000).toISOString()
  };

  const sampleFormId = 'form_household_survey';
  const sampleQuestions = [
    {
      id: 'q_age',
      name: 'respondent_age',
      label: 'What is the respondent\'s age in completed years?',
      hint: 'Must be between 0 and 120.',
      type: 'integer' as const,
      required: true,
      constraint: '. >= 0 and . <= 120',
      constraintMessage: 'Age must be between 0 and 120.',
      order: 1
    },
    {
      id: 'q_gender',
      name: 'respondent_gender',
      label: 'Gender of respondent',
      type: 'select_one' as const,
      required: true,
      choices: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' }
      ],
      order: 2
    },
    {
      id: 'q_state',
      name: 'state_of_residence',
      label: 'State of Residence',
      type: 'dropdown' as const,
      required: true,
      choices: [
        { value: 'lagos', label: 'Lagos' },
        { value: 'kano', label: 'Kano' },
        { value: 'abuja', label: 'Abuja FCT' },
        { value: 'rivers', label: 'Rivers' },
        { value: 'oyo', label: 'Oyo' },
        { value: 'kaduna', label: 'Kaduna' },
        { value: 'enugu', label: 'Enugu' }
      ],
      order: 3
    },
    {
      id: 'q_owns_phone',
      name: 'owns_phone',
      label: 'Do you own a mobile phone?',
      type: 'yes_no' as const,
      required: true,
      choices: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ],
      order: 4
    },
    {
      id: 'q_network',
      name: 'network',
      label: 'Which primary mobile network do you use?',
      hint: 'Select your main SIM provider.',
      type: 'select_one' as const,
      required: true,
      relevant: "${owns_phone} = 'yes'",
      choices: [
        { value: 'mtn', label: 'MTN' },
        { value: 'airtel', label: 'Airtel' },
        { value: 'glo', label: 'Glo' },
        { value: '9mobile', label: '9mobile' }
      ],
      order: 5
    },
    {
      id: 'q_data_spend',
      name: 'data_spend',
      label: 'How much do you spend on mobile data monthly (in NGN)?',
      hint: 'Estimate your average monthly expenditure.',
      type: 'decimal' as const,
      required: true,
      relevant: "${owns_phone} = 'yes'",
      constraint: '. >= 0',
      constraintMessage: 'Monthly data spend cannot be negative.',
      order: 6
    },
    {
      id: 'q_annual_spend',
      name: 'annual_spend',
      label: 'Estimated Annual Telecom Expenditure (NGN)',
      type: 'calculate' as const,
      required: false,
      relevant: "${owns_phone} = 'yes'",
      calculation: '${data_spend} * 12',
      order: 7
    },
    {
      id: 'q_gps',
      name: 'household_gps',
      label: 'Capture Household GPS Location',
      hint: 'Record satellite coordinates with highest accuracy possible.',
      type: 'geopoint' as const,
      required: false,
      order: 8
    },
    {
      id: 'q_photo',
      name: 'respondent_photo',
      label: 'Household Exterior / Respondent Photo',
      hint: 'Ensure clear lighting.',
      type: 'image' as const,
      required: false,
      order: 9
    },
    {
      id: 'q_voice',
      name: 'voice_note',
      label: 'Enumerator Voice Verification Note',
      hint: 'Record 10-second summary confirmation.',
      type: 'audio' as const,
      required: false,
      order: 10
    }
  ];

  const sampleForm: Form = {
    id: sampleFormId,
    projectId: sampleProjectId,
    projectName: sampleProject.name,
    title: 'CMRG Household Survey 2026',
    description: 'Standard questionnaire capturing demographics, phone ownership, network usage, data expenditure, and geolocations.',
    status: 'PUBLISHED',
    currentVersion: 1,
    currentVersionId: 'ver_household_v1',
    questions: sampleQuestions,
    settings: {
      formTitle: 'CMRG Household Survey 2026',
      formId: 'cmrg_household_v1',
      defaultLanguage: 'English',
      allowDrafts: true,
      requireGps: false
    },
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 10 * 86400000).toISOString()
  };

  const sampleVersion: FormVersion = {
    id: 'ver_household_v1',
    formId: sampleFormId,
    versionNumber: 1,
    versionTag: 'v1.0',
    publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    publishedBy: adminUser.name,
    questions: sampleQuestions,
    settings: sampleForm.settings,
    notes: 'Initial production baseline for national pilot'
  };

  const sampleDeployments: Deployment[] = [
    {
      id: 'dep_1',
      projectId: sampleProjectId,
      formId: sampleFormId,
      formVersionId: sampleVersion.id,
      versionNumber: 1,
      formTitle: sampleForm.title,
      targetType: 'ALL',
      status: 'ACTIVE',
      deployedAt: new Date(Date.now() - 9 * 86400000).toISOString()
    }
  ];

  const sampleSubmissions: Submission[] = [
    {
      id: 'sub_srv_101',
      clientSubmissionId: 'client_uuid_001',
      projectId: sampleProjectId,
      projectName: sampleProject.name,
      formId: sampleFormId,
      formTitle: sampleForm.title,
      formVersionId: sampleVersion.id,
      versionNumber: 1,
      enumeratorId: enumerator1.id,
      enumeratorName: enumerator1.name,
      deviceId: enumerator1.deviceId || 'DEV-CMRG-8821',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      status: 'APPROVED',
      syncStatus: 'SYNCED',
      answers: {
        respondent_age: 34,
        respondent_gender: 'female',
        state_of_residence: 'lagos',
        owns_phone: 'yes',
        network: 'mtn',
        data_spend: 4500,
        annual_spend: 54000
      },
      geolocation: {
        latitude: 6.5244,
        longitude: 3.3792,
        accuracy: 4.8,
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      review: {
        reviewedBy: supervisorUser.name,
        reviewedAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'APPROVED',
        comments: 'Verified data spend and GPS coordinates match enumeration area.'
      }
    },
    {
      id: 'sub_srv_102',
      clientSubmissionId: 'client_uuid_002',
      projectId: sampleProjectId,
      projectName: sampleProject.name,
      formId: sampleFormId,
      formTitle: sampleForm.title,
      formVersionId: sampleVersion.id,
      versionNumber: 1,
      enumeratorId: enumerator2.id,
      enumeratorName: enumerator2.name,
      deviceId: enumerator2.deviceId || 'DEV-CMRG-9943',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      status: 'COMPLETED',
      syncStatus: 'SYNCED',
      answers: {
        respondent_age: 62,
        respondent_gender: 'male',
        state_of_residence: 'kano',
        owns_phone: 'no'
      },
      geolocation: {
        latitude: 12.0022,
        longitude: 8.592,
        accuracy: 6.1,
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    }
  ];

  const sampleDevices: Device[] = [
    {
      id: 'dev_1',
      deviceId: 'DEV-CMRG-8821',
      deviceName: 'Samsung Galaxy Tab A8 #1',
      assignedUserId: enumerator1.id,
      assignedUserName: enumerator1.name,
      appVersion: 'CMRG Collect v2.4.0',
      lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
      pendingSubmissionsCount: 0,
      status: 'ACTIVE',
      deviceModel: 'SM-X200',
      osVersion: 'Android 13'
    },
    {
      id: 'dev_2',
      deviceId: 'DEV-CMRG-9943',
      deviceName: 'Tecno Spark 10 Pro #4',
      assignedUserId: enumerator2.id,
      assignedUserName: enumerator2.name,
      appVersion: 'CMRG Collect v2.4.0',
      lastSyncAt: new Date(Date.now() - 1800000).toISOString(),
      pendingSubmissionsCount: 0,
      status: 'ACTIVE',
      deviceModel: 'KI7',
      osVersion: 'Android 13'
    }
  ];

  const sampleLogs: AuditLog[] = [
    {
      id: 'log_1',
      timestamp: new Date(Date.now() - 25 * 86400000).toISOString(),
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'PROJECT_CREATED',
      resource: sampleProject.name,
      details: 'Created National Socioeconomic & Tech Survey project'
    },
    {
      id: 'log_2',
      timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'FORM_PUBLISHED',
      resource: sampleForm.title,
      details: 'Published Form Version 1.0 with 10 questions and skip logic'
    },
    {
      id: 'log_3',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      userId: enumerator1.id,
      userName: enumerator1.name,
      action: 'SUBMISSION_RECEIVED',
      resource: sampleSubmissions[0].id,
      details: 'Submission synced from offline mobile client'
    }
  ];

  return {
    users: [adminUser, projectManagerUser, supervisorUser, enumerator1, enumerator2, dataAnalystUser],
    projects: [sampleProject],
    forms: [sampleForm],
    formVersions: [sampleVersion],
    deployments: sampleDeployments,
    submissions: sampleSubmissions,
    devices: sampleDevices,
    auditLogs: sampleLogs
  };
}

class DatabaseService {
  private data: CMRGDatabase;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): CMRGDatabase {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed: CMRGDatabase = JSON.parse(raw);
        if (Array.isArray(parsed.submissions)) {
          const seenSub = new Set<string>();
          parsed.submissions = parsed.submissions.filter(s => {
            if (!s || !s.id) return false;
            if (seenSub.has(s.id)) return false;
            seenSub.add(s.id);
            return true;
          });
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing cmrg_database.json, re-initializing fresh database', e);
    }
    const fresh = getInitialDatabase();
    this.save(fresh);
    return fresh;
  }

  private save(dataToSave?: CMRGDatabase): void {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to disk:', err);
    }
  }

  public getStats() {
    const totalProjects = this.data.projects.length;
    const activeProjects = this.data.projects.filter(p => p.status === 'ACTIVE').length;
    const publishedForms = this.data.forms.filter(f => f.status === 'PUBLISHED').length;
    const totalSubmissions = this.data.submissions.length;
    const pendingSubmissions = this.data.submissions.filter(s => s.status === 'COMPLETED' || s.status === 'QUEUED').length;
    const approvedSubmissions = this.data.submissions.filter(s => s.status === 'APPROVED').length;
    const syncedSubmissions = this.data.submissions.filter(s => s.syncStatus === 'SYNCED').length;
    const activeEnumerators = this.data.users.filter(u => u.role === 'ENUMERATOR' && u.status === 'ACTIVE').length;

    return {
      totalProjects,
      activeProjects,
      publishedForms,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      syncedSubmissions,
      failedSubmissions: 0,
      activeEnumerators,
      recentActivity: this.data.auditLogs.slice(0, 10)
    };
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public findUser(identifier: string): User | undefined {
    if (!identifier) return undefined;
    const clean = identifier.toLowerCase().trim();
    return this.data.users.find(
      u => u.email.toLowerCase() === clean ||
           u.id.toLowerCase() === clean ||
           (u.username && u.username.toLowerCase() === clean) ||
           u.name.toLowerCase() === clean
    );
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates);
      this.save();
    }
    return user;
  }

  // Projects
  public getProjects(): Project[] {
    return this.data.projects.map(p => {
      const formCount = this.data.forms.filter(f => f.projectId === p.id).length;
      const subCount = this.data.submissions.filter(s => s.projectId === p.id).length;
      return { ...p, formCount, submissionCount: subCount };
    });
  }

  public getProject(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  public createProject(project: Project): Project {
    this.data.projects.unshift(project);
    this.logAudit(project.createdBy, 'PROJECT_CREATED', project.name, `Created project "${project.name}"`);
    this.save();
    return project;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const p = this.data.projects.find(x => x.id === id);
    if (p) {
      Object.assign(p, updates);
      this.save();
    }
    return p;
  }

  // Forms
  public getForms(): Form[] {
    return this.data.forms.map(f => {
      const submissionsCount = this.data.submissions.filter(s => s.formId === f.id).length;
      const proj = this.data.projects.find(p => p.id === f.projectId);
      return { ...f, submissionsCount, projectName: proj ? proj.name : f.projectName };
    });
  }

  public getForm(id: string): Form | undefined {
    return this.data.forms.find(f => f.id === id);
  }

  public createForm(form: Form, author = 'Admin'): Form {
    this.data.forms.unshift(form);
    this.logAudit(author, 'FORM_CREATED', form.title, `Created questionnaire "${form.title}" with ${form.questions.length} questions`);
    this.save();
    return form;
  }

  public updateForm(id: string, updates: Partial<Form>): Form | undefined {
    const f = this.data.forms.find(x => x.id === id);
    if (f) {
      Object.assign(f, updates, { updatedAt: new Date().toISOString() });
      this.save();
    }
    return f;
  }

  public publishForm(id: string, publishedBy: string, notes?: string): FormVersion {
    const form = this.data.forms.find(f => f.id === id);
    if (!form) throw new Error('Form not found');

    const nextVersionNum = (form.currentVersion || 0) + 1;
    const versionId = `ver_${form.id}_v${nextVersionNum}`;

    const newVersion: FormVersion = {
      id: versionId,
      formId: form.id,
      versionNumber: nextVersionNum,
      versionTag: `v${nextVersionNum}.0`,
      publishedAt: new Date().toISOString(),
      publishedBy,
      questions: JSON.parse(JSON.stringify(form.questions)),
      settings: JSON.parse(JSON.stringify(form.settings)),
      notes: notes || `Published Version ${nextVersionNum}.0`
    };

    this.data.formVersions.push(newVersion);
    form.status = 'PUBLISHED';
    form.currentVersion = nextVersionNum;
    form.currentVersionId = versionId;
    form.publishedAt = newVersion.publishedAt;
    form.updatedAt = newVersion.publishedAt;

    this.logAudit(
      publishedBy,
      'FORM_PUBLISHED',
      form.title,
      `Published Version ${nextVersionNum}.0 of form "${form.title}"`
    );

    this.save();
    return newVersion;
  }

  public getFormVersions(formId: string): FormVersion[] {
    return this.data.formVersions.filter(v => v.formId === formId);
  }

  // Deployments
  public getDeployments(): Deployment[] {
    return this.data.deployments;
  }

  public createDeployment(dep: Deployment, author = 'Admin'): Deployment {
    this.data.deployments.unshift(dep);
    this.logAudit(author, 'DEPLOYMENT_CREATED', dep.formTitle, `Deployed form to target: ${dep.targetType}`);
    this.save();
    return dep;
  }

  // Submissions (With IDEMPOTENCY)
  public getSubmissions(filter?: { projectId?: string; formId?: string; enumeratorId?: string }): Submission[] {
    let list = [...this.data.submissions];
    if (filter?.projectId) list = list.filter(s => s.projectId === filter.projectId);
    if (filter?.formId) list = list.filter(s => s.formId === filter.formId);
    if (filter?.enumeratorId) list = list.filter(s => s.enumeratorId === filter.enumeratorId);
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public getSubmission(id: string): Submission | undefined {
    return this.data.submissions.find(s => s.id === id || s.clientSubmissionId === id);
  }

  /**
   * Idempotent submission sync
   * If clientSubmissionId already exists, updates or returns existing without creating duplicate
   */
  public syncSubmissions(incomingList: Submission[]): { synced: Submission[]; duplicates: number } {
    const synced: Submission[] = [];
    let duplicates = 0;

    for (const incoming of incomingList) {
      const existing = this.data.submissions.find(
        s => s.clientSubmissionId === incoming.clientSubmissionId
      );

      if (existing) {
        duplicates++;
        // Update if newer
        existing.status = incoming.status || existing.status;
        existing.syncStatus = 'SYNCED';
        synced.push(existing);
      } else {
        const newRecord: Submission = {
          ...incoming,
          id: incoming.id && !incoming.id.startsWith('draft_') && !incoming.id.startsWith('local_')
            ? incoming.id
            : `sub_srv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          syncStatus: 'SYNCED',
          submittedAt: incoming.submittedAt || new Date().toISOString()
        };
        this.data.submissions.unshift(newRecord);
        synced.push(newRecord);

        this.logAudit(
          incoming.enumeratorName || 'Enumerator',
          'SUBMISSION_RECEIVED',
          newRecord.formTitle || 'Submission',
          `Synced submission ${newRecord.id} from device ${newRecord.deviceId}`
        );
      }
    }

    this.save();
    return { synced, duplicates };
  }

  public reviewSubmission(id: string, reviewer: string, status: 'APPROVED' | 'REJECTED' | 'FLAGGED', comments: string): Submission | undefined {
    const s = this.data.submissions.find(x => x.id === id);
    if (s) {
      s.status = status;
      s.review = {
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
        status,
        comments
      };
      this.logAudit(reviewer, `SUBMISSION_${status}`, s.id, `Submission marked as ${status}. Notes: ${comments}`);
      this.save();
    }
    return s;
  }

  // Devices
  public getDevices(): Device[] {
    return this.data.devices;
  }

  public updateDeviceSync(deviceId: string, userId: string, userName: string): void {
    let dev = this.data.devices.find(d => d.deviceId === deviceId);
    if (dev) {
      dev.lastSyncAt = new Date().toISOString();
      dev.assignedUserId = userId;
      dev.assignedUserName = userName;
      dev.status = 'ACTIVE';
    } else {
      dev = {
        id: `dev_${Date.now()}`,
        deviceId,
        deviceName: `Field Device (${deviceId})`,
        assignedUserId: userId,
        assignedUserName: userName,
        appVersion: 'CMRG Collect v2.4.0',
        lastSyncAt: new Date().toISOString(),
        pendingSubmissionsCount: 0,
        status: 'ACTIVE'
      };
      this.data.devices.push(dev);
    }
    this.save();
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.slice(0, 100);
  }

  public logAudit(userName: string, action: string, resource: string, details: string): void {
    this.data.auditLogs.unshift({
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: 'user_active',
      userName,
      action,
      resource,
      details
    });
    if (this.data.auditLogs.length > 250) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 250);
    }
  }

  // Backup & Restore
  public exportBackup(): { version: string; exportedAt: string; checksum: string; recordCounts: Record<string, number>; data: CMRGDatabase } {
    const jsonStr = JSON.stringify(this.data);
    let hash = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      hash = ((hash << 5) - hash + jsonStr.charCodeAt(i)) | 0;
    }
    const checksum = `crc32_${Math.abs(hash).toString(16)}`;

    return {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      checksum,
      recordCounts: {
        users: this.data.users.length,
        projects: this.data.projects.length,
        forms: this.data.forms.length,
        formVersions: this.data.formVersions.length,
        deployments: this.data.deployments.length,
        submissions: this.data.submissions.length,
        devices: this.data.devices.length,
        auditLogs: this.data.auditLogs.length
      },
      data: JSON.parse(jsonStr)
    };
  }

  public restoreBackup(payload: any, restoredBy = 'Admin'): { success: boolean; message: string; recordCounts: Record<string, number> } {
    if (!payload || !payload.data) {
      throw new Error('Invalid backup payload: missing data field');
    }

    const d = payload.data;
    if (!Array.isArray(d.users) || !Array.isArray(d.projects) || !Array.isArray(d.forms) || !Array.isArray(d.submissions)) {
      throw new Error('Invalid backup data schema: essential tables missing');
    }

    this.data = {
      users: d.users,
      projects: d.projects,
      forms: d.forms,
      formVersions: d.formVersions || [],
      deployments: d.deployments || [],
      submissions: d.submissions || [],
      devices: d.devices || [],
      auditLogs: d.auditLogs || []
    };

    this.logAudit(restoredBy, 'DATABASE_RESTORED', 'System Database', `Restored from backup exported at ${payload.exportedAt || 'unknown'}`);
    this.save();

    return {
      success: true,
      message: 'Database restored successfully',
      recordCounts: {
        users: this.data.users.length,
        projects: this.data.projects.length,
        forms: this.data.forms.length,
        submissions: this.data.submissions.length
      }
    };
  }
}

export const db = new DatabaseService();
