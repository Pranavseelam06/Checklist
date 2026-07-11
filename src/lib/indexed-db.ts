import type { Checklist } from "@/src/types";

const DB_NAME = "personal-checklists";
const DB_VERSION = 1;
const STORE_NAME = "checklists";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getChecklists() {
  return withStore<Checklist[]>("readonly", (store) => store.getAll());
}

export async function saveChecklist(checklist: Checklist) {
  await withStore<IDBValidKey>("readwrite", (store) => store.put(checklist));
}

export async function removeChecklist(id: string) {
  await withStore<undefined>("readwrite", (store) => store.delete(id));
}
