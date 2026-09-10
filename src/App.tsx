import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MarketingLanding } from './components/MarketingLanding';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { FormsView } from './components/FormsView';
import { FormBuilder } from './components/FormBuilder';
import { SubmissionsView } from './components/SubmissionsView';
import { DeploymentsView } from './components/DeploymentsView';
import { CollectApp } from './components/CollectApp';
import { ImportFormModal } from './components/ImportFormModal';
import { ImportReviewModal } from './components/ImportReviewModal';
import { FormTestRunner } from './components/FormTestRunner';
import { WelcomePortal } from './components/WelcomePortal';
import { SimulatedSecretsModal } from './components/SimulatedSecretsModal';

import {
  Project,
  Form,
  Submission,
  Deployment,
  User,
  DashboardStats,
  FormImportResult,
  Question
} from '../shared/types';
import {
  fetchProjects,
  fetchForms,
  fetchSubmissions,
  fetchDeployments,
  fetchUsers,
  fetchDashboardStats,
  saveForm,
  publishForm,
  deleteForm,
  deployForm
} from './lib/api';
import { offlineDb } from './lib/indexedDb';

export const App: React.FC = () => {
  // Navigation View: 'marketing' | 'welcome' | 'dashboard' | 'projects' | 'forms' | 'builder' | 'submissions' | 'deployments' | 'collect'
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Application Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalForms: 0,
    publishedForms: 0,
    totalSubmissions: 0,
    approvedSubmissions: 0,
    activeEnumerators: 0,
    pendingSyncSubmissions: 0
  });

  // Current logged in user context
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_admin_1',
    name: 'Dr. Amina Bello',
    email: 'amina.bello@cmrg.org',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  // Offline simulation toggle
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Modals & Active Selections
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<FormImportResult | null>(null);
  const [isImportReviewOpen, setIsImportReviewOpen] = useState(false);
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);

  // Form Builder Active Form
  const [builderForm, setBuilderForm] = useState<Form | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Quick Form Test Runner from Import Review
  const [quickTestForm, setQuickTestForm] = useState<{ title: string; questions: Question[] } | null>(null);

  // Global Toast Notice
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Initial Load from Server API
  const refreshAllData = async () => {
    try {
      const [p, f, s, d, u, st] = await Promise.all([
        fetchProjects().catch(() => []),
        fetchForms().catch(() => []),
        fetchSubmissions().catch(() => []),
        fetchDeployments().catch(() => []),
        fetchUsers().catch(() => []),
        fetchDashboardStats().catch(() => ({
          totalProjects: 2,
          totalForms: 3,
          publishedForms: 2,
          totalSubmissions: 4,
          approvedSubmissions: 2,
          activeEnumerators: 8,
          pendingSyncSubmissions: 0
        }))
      ]);

      setProjects(p);
      setForms(f);
      setSubmissions(s);
      setDeployments(d);
      setUsers(u);
      setStats(st);

      // Check offline queue count
      const queue = await offlineDb.getPendingSyncItems();
      setPendingSyncCount(queue.length);
    } catch (err) {
      console.warn('Network sync notice: working in offline cached mode', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [isOfflineSimulated]);

  // Import Workflow: Step 5 -> Step 6 (Review Imported Form)
  const handleImportComplete = (result: FormImportResult) => {
    setIsImportModalOpen(false);
    setImportResult(result);
    setIsImportReviewOpen(true);
  };

  // Import Review: Save directly as new Form
  const handleSaveImportedForm = async (title: string, questions: Question[]) => {
    const selectedProject = projects.find(project => project.id === selectedProjectId) || projects[0];
    const newForm: Form = {
      id: `form_cmrg_${Date.now()}`,
      projectId: selectedProject?.id || 'proj_rural_fin_2026',
      projectName: selectedProject?.name || 'CMRG Research Program',
      title,
      description: `Imported from questionnaire sheet with ${questions.length} questions.`,
      status: 'DRAFT',
      currentVersion: 0,
      currentVersionId: `ver_${Date.now()}_v1`,
      questions,
      settings: {
        formTitle: title,
        formId: `cmrg_${title.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
        defaultLanguage: 'en',
        allowDrafts: true,
        requireGps: questions.some(q => q.type === 'geopoint')
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveForm(newForm);
    await offlineDb.saveDownloadedForm(newForm); // Also make available to offline field app immediately
    await refreshAllData();
    setIsImportReviewOpen(false);
    showToast(`Form "${title}" saved as a draft. Open Builder to review and publish it.`);
    setCurrentView('forms');
  };

  // Import Review: Open in Builder
  const handleOpenImportInBuilder = (title: string, questions: Question[]) => {
    const selectedProject = projects.find(project => project.id === selectedProjectId) || projects[0];
    const newForm: Form = {
      id: `form_cmrg_${Date.now()}`,
      projectId: selectedProject?.id || 'proj_rural_fin_2026',
      projectName: selectedProject?.name || 'CMRG Research Program',
      title,
      description: `Imported questionnaire with ${questions.length} questions.`,
      status: 'DRAFT',
      currentVersion: 1,
      questions,
      settings: {
        formTitle: title,
        formId: `cmrg_${title.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
        defaultLanguage: 'en',
        allowDrafts: true,
        requireGps: questions.some(q => q.type === 'geopoint')
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setBuilderForm(newForm);
    setIsImportReviewOpen(false);
    setCurrentView('builder');
  };

  // Create Blank Form
  const handleCreateBlankForm = () => {
    const selectedProject = projects.find(project => project.id === selectedProjectId) || projects[0];
    const blank: Form = {
      id: `form_cmrg_${Date.now()}`,
      projectId: selectedProject?.id || 'proj_rural_fin_2026',
      projectName: selectedProject?.name || 'CMRG Research Program',
      title: 'New Questionnaire',
      description: 'Custom field survey designed with CMRG Form Builder',
      status: 'DRAFT',
      currentVersion: 1,
      questions: [
        {
          id: `q_${Date.now()}_1`,
          name: 'respondent_name',
          label: 'Respondent Full Name',
          type: 'text',
          required: true,
          order: 1
        }
      ],
      settings: {
        formTitle: 'New Questionnaire',
        formId: `form_${Date.now()}`,
        defaultLanguage: 'en',
        allowDrafts: true,
        requireGps: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setBuilderForm(blank);
    setCurrentView('builder');
  };

  const handleSelectFormForEdit = (form: Form) => {
    setBuilderForm(form);
    setCurrentView('builder');
  };

  const handleSaveFormInBuilder = async (updatedForm: Form) => {
    await saveForm(updatedForm);
    await refreshAllData();
    showToast('Questionnaire saved successfully');
  };

  const handlePublishFormInBuilder = async (formId: string, notes?: string) => {
    const res = await publishForm(formId, currentUser.name, notes);
    setBuilderForm(res.form);
    await offlineDb.saveDownloadedForm(res.form);
    await refreshAllData();
    showToast(`Questionnaire published as Version v${res.form.currentVersion}.0!`);
  };

  const handleDeleteForm = async (formId: string) => {
    if (confirm('Are you sure you want to delete this questionnaire?')) {
      await deleteForm(formId);
      await refreshAllData();
      showToast('Form removed from library');
    }
  };

  const handleDeployForm = async (form: Form) => {
    await deployForm({
      projectId: form.projectId,
      formId: form.id,
      formTitle: form.title,
      formVersionId: form.currentVersionId || 'v1',
      versionNumber: form.currentVersion || 1,
      targetType: 'ALL',
      status: 'ACTIVE'
    });
    await refreshAllData();
    showToast(`Deployed "${form.title}" to field enumerator fleet!`);
    setCurrentView('deployments');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Primary Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSecretsModal={() => setIsSecretsModalOpen(true)}
        isOfflineSimulated={isOfflineSimulated}
        onToggleOffline={() => setIsOfflineSimulated(prev => !prev)}
        pendingSyncCount={pendingSyncCount}
        currentUser={currentUser}
        onSwitchUser={(user) => setCurrentUser(user)}
      />

      {/* Global Toast Notification */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#05070a] text-white border border-[#FF2D20]/50 px-4 py-3 rounded-xl shadow-2xl shadow-red-950/40 text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#FF2D20]" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Main View Switcher */}
      <main className="flex-1">
        {currentView === 'welcome' && (
          <WelcomePortal
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setCurrentView('dashboard');
              showToast(`Welcome back, ${user.name}!`);
            }}
            onExploreMarketing={() => setCurrentView('marketing')}
            currentUser={currentUser}
          />
        )}

        {currentView === 'marketing' && (
          <MarketingLanding
            onLaunchApp={(targetView) => setCurrentView(targetView || 'dashboard')}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {currentView === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DashboardView
              stats={stats}
              recentSubmissions={submissions}
              forms={forms}
              projects={projects}
              onNavigate={(view) => setCurrentView(view)}
              onOpenImport={() => setIsImportModalOpen(true)}
              onSelectFormForEdit={handleSelectFormForEdit}
            />
          </div>
        )}

        {currentView === 'projects' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProjectsView
              projects={projects}
              forms={forms}
              onRefresh={refreshAllData}
              onSelectProject={(projectId) => {
                setSelectedProjectId(projectId);
                setCurrentView('forms');
              }}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          </div>
        )}

        {currentView === 'forms' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FormsView
              forms={forms}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onOpenImport={() => setIsImportModalOpen(true)}
              onCreateNewForm={handleCreateBlankForm}
              onSelectFormForEdit={handleSelectFormForEdit}
              onDeleteForm={handleDeleteForm}
              onDeployForm={handleDeployForm}
            />
          </div>
        )}

        {currentView === 'builder' && (
          <FormBuilder
            initialForm={builderForm || forms[0] || {
              id: 'form_temp',
              projectId: 'p1',
              title: 'Untitled Questionnaire',
              description: '',
              status: 'DRAFT',
              questions: [],
              settings: { formTitle: 'Untitled', formId: 'untitled', defaultLanguage: 'en', allowDrafts: true, requireGps: false },
              createdAt: '',
              updatedAt: ''
            }}
            onSave={handleSaveFormInBuilder}
            onPublish={handlePublishFormInBuilder}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onBack={() => setCurrentView('forms')}
          />
        )}

        {currentView === 'submissions' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SubmissionsView
              submissions={submissions}
              forms={forms}
              projects={projects}
              onRefresh={refreshAllData}
              currentUser={currentUser}
            />
          </div>
        )}

        {currentView === 'deployments' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DeploymentsView
              deployments={deployments}
              forms={forms}
              users={users}
              onRefresh={refreshAllData}
            />
          </div>
        )}

        {currentView === 'collect' && (
          <div className="py-6">
            <CollectApp
              currentUser={{ id: currentUser.id, name: currentUser.name, deviceId: currentUser.deviceId }}
              isOfflineSimulated={isOfflineSimulated}
              onToggleOffline={() => setIsOfflineSimulated(prev => !prev)}
              onSyncStateChange={(count) => setPendingSyncCount(count)}
            />
          </div>
        )}
      </main>

      {/* Prominent Drag & Drop Existing Form Import Modal */}
      <ImportFormModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportComplete}
      />

      {/* Review Imported Form Modal */}
      <ImportReviewModal
        isOpen={isImportReviewOpen}
        importResult={importResult}
        onClose={() => setIsImportReviewOpen(false)}
        onSaveAsForm={handleSaveImportedForm}
        onOpenInBuilder={handleOpenImportInBuilder}
        onTestForm={(title, questions) => {
          setQuickTestForm({ title, questions });
        }}
      />

      {/* Quick Test Runner Modal from Review */}
      {quickTestForm && (
        <FormTestRunner
          isOpen={true}
          onClose={() => setQuickTestForm(null)}
          formTitle={quickTestForm.title}
          questions={quickTestForm.questions}
        />
      )}

      {/* Simulated Secrets & VS Code Handoff Modal */}
      <SimulatedSecretsModal
        isOpen={isSecretsModalOpen}
        onClose={() => setIsSecretsModalOpen(false)}
      />
    </div>
  );
};

export default App;
