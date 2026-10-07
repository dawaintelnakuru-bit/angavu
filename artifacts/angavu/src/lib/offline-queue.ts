import type { AngavuEntryInput } from '@workspace/api-client-react';

const DB_NAME = 'angavu-local';
const STORE = 'pending-entries';

function openQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local entry storage.'));
  });
}

export async function readQueue(): Promise<AngavuEntryInput[]> {
  if (!('indexedDB' in window)) return [];
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as AngavuEntryInput[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveQueueEntry(entry: AngavuEntryInput): Promise<void> {
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeQueueEntries(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    ids.forEach((id) => tx.objectStore(STORE).delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
