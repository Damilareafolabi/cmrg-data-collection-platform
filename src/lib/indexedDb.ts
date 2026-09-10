import { Form, Submission, FormVersion } from '../../shared/types';

const DB_NAME = 'cmrg_collect_offline_db';
const DB_VERSION = 2;

export interface OfflineDraft {
  localId: string;
  formId: string;
  formTitle: string;
  formVersionId: string;
  versionNumber: number;
  answers: Record<string, any>;
  repeatData?: Record<string, Record<string, any>[]>;
  updatedAt: string;
  enumeratorName: string;
}

export interface SyncQueueItem {
  id: string; // clientSubmissionId
  submission: Submission;
  enqueuedAt: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  lastError?: string;
}

class IndexedDbClient {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private memoryStores: Record<string, Map<string, any>> = {
    forms: new Map(),
    form_versions: new Map(),
    assignments: new Map(),
    drafts: new Map(),
    submissions: new Map(),
    attachments: new Map(),
    sync_queue: new Map()
  };

  private openDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || !window.indexedDB) {
          console.warn('[CMRG Offline DB] IndexedDB unavailable, using memory store fallback');
          return resolve(null);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          try {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('forms')) {
              db.createObjectStore('forms', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('form_versions')) {
              db.createObjectStore('form_versions', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('assignments')) {
              db.createObjectStore('assignments', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('drafts')) {
              db.createObjectStore('drafts', { keyPath: 'localId' });
            }
            if (!db.objectStoreNames.contains('submissions')) {
              db.createObjectStore('submissions', { keyPath: 'clientSubmissionId' });
            }
            if (!db.objectStoreNames.contains('attachments')) {
              db.createObjectStore('attachments', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('sync_queue')) {
              db.createObjectStore('sync_queue', { keyPath: 'id' });
            }
          } catch (e) {
            console.warn('[CMRG Offline DB] Upgrade error:', e);
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => {
          console.warn('[CMRG Offline DB] IndexedDB open error, using memory fallback:', e);
          resolve(null);
        };
      } catch (err) {
        console.warn('[CMRG Offline DB] Error initializing IndexedDB, using memory fallback:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  // Forms
  public async saveDownloadedForm(form: Form): Promise<void> {
    try {
      const db = await this.openDB();
      if (db) {
        const tx = db.transaction('forms', 'readwrite');
        const store = tx.objectStore('forms');
        await new Promise<void>((resolve, reject) => {
          const req = store.put(form);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        return;
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for saveDownloadedForm:', e);
    }
    this.memoryStores.forms.set(form.id, form);
  }

  public async getDownloadedForms(): Promise<Form[]> {
    try {
      const db = await this.openDB();
      if (db) {
        const tx = db.transaction('forms', 'readonly');
        const store = tx.objectStore('forms');
        return await new Promise<Form[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for getDownloadedForms:', e);
    }
    return Array.from(this.memoryStores.forms.values());
  }

  public async getDownloadedForm(id: string): Promise<Form | undefined> {
    try {
      const db = await this.openDB();
      if (db) {
        const tx = db.transaction('forms', 'readonly');
        const store = tx.objectStore('forms');
        return await new Promise<Form | undefined>((resolve, reject) => {
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for getDownloadedForm:', e);
    }
    return this.memoryStores.forms.get(id);
  }

  // Drafts
  public async saveDraft(draft: OfflineDraft): Promise<void> {
    try {
      const db = await this.openDB();
      if (db) {
        const tx = db.transaction('drafts', 'readwrite');
        const store = tx.objectStore('drafts');
        await new Promise<void>((resolve, reject) => {
          const req = store.put(draft);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        return;
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for saveDraft:', e);
    }
    this.memoryStores.drafts.set(draft.localId, draft);
  }

  public async getDrafts(): Promise<OfflineDraft[]> {
    try {
      const db = await this.openDB();
      if (db) {
        const tx = db.transaction('drafts', 'readonly');
        const store = tx.objectStore('drafts');
        return await new Promise<OfflineDraft[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for getDrafts:', e);
    }
    return Array.from(this.memoryStores.drafts.values());
  }

  public async deleteDraft(localId: string): Promise<void> {
    try {
      const db = await this.openDB();
      if (db) {
        const tx = db.transaction('drafts', 'readwrite');
        const store = tx.objectStore('drafts');
        await new Promise<void>((resolve, reject) => {
          const req = store.delete(localId);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        return;
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for deleteDraft:', e);
    }
    this.memoryStores.drafts.delete(localId);
  }

  // Local Submissions
  public async saveLocalSubmission(sub: Submission): Promise<void> {
    try {
      const db = await this.openDB();
      if (db) {
        const tx = db.transaction(['submissions', 'sync_queue'], 'readwrite');
        const subStore = tx.objectStore('submissions');
        const queueStore = tx.objectStore('sync_queue');

        await new Promise<void>((resolve, reject) => {
          const req1 = subStore.put(sub);
          req1.onsuccess = () => {
            const queueItem: SyncQueueItem = {
              id: sub.clientSubmissionId,
              submission: sub,
              enqueuedAt: new Date().toISOString(),
              retryCount: 0,
              status: 'PENDING'
            };
            const req2 = queueStore.put(queueItem);
            req2.onsuccess = () => resolve();
            req2.onerror = () => reject(req2.error);
          };
          req1.onerror = () => reject(req1.error);
        });
        return;
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for saveLocalSubmission:', e);
    }

    this.memoryStores.submissions.set(sub.clientSubmissionId, sub);
    this.memoryStores.sync_queue.set(sub.clientSubmissionId, {
      id: sub.clientSubmissionId,
      submission: sub,
      enqueuedAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING'
    });
  }

  public async getLocalSubmissions(): Promise<Submission[]> {
    try {
      const db = await this.openDB();
      if (db) {
        const tx = db.transaction('submissions', 'readonly');
        const store = tx.objectStore('submissions');
        return await new Promise<Submission[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for getLocalSubmissions:', e);
    }
    return Array.from(this.memoryStores.submissions.values());
  }

  // Sync Queue
  public async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    try {
      const db = await this.openDB();
      if (db) {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        return await new Promise<SyncQueueItem[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for getPendingSyncItems:', e);
    }
    return Array.from(this.memoryStores.sync_queue.values());
  }

  public async markSyncComplete(clientSubmissionId: string): Promise<void> {
    try {
      const db = await this.openDB();
      if (db) {
        const queueStore = db.transaction('sync_queue', 'readwrite').objectStore('sync_queue');
        await new Promise<void>((resolve) => {
          const req = queueStore.delete(clientSubmissionId);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });

        const subStore = db.transaction('submissions', 'readwrite').objectStore('submissions');
        const existing: Submission | undefined = await new Promise((resolve) => {
          const req = subStore.get(clientSubmissionId);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
        });

        if (existing) {
          existing.syncStatus = 'SYNCED';
          existing.status = 'COMPLETED';
          await new Promise<void>((resolve) => {
            const req = subStore.put(existing);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
          });
        }
        return;
      }
    } catch (e) {
      console.warn('[CMRG Offline DB] Falling back to memory for markSyncComplete:', e);
    }

    this.memoryStores.sync_queue.delete(clientSubmissionId);
    const inMemSub = this.memoryStores.submissions.get(clientSubmissionId);
    if (inMemSub) {
      inMemSub.syncStatus = 'SYNCED';
      inMemSub.status = 'COMPLETED';
    }
  }
}

export const offlineDb = new IndexedDbClient();
