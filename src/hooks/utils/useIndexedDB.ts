import { createSignal, onMount } from "solid-js";

// IndexedDB setup (shared across the app)
const DB_NAME = "VolcanoWorkflowDB";
const DB_VERSION = 3; // Increased version to upgrade the database
const STORE_NAME = "keyValueStore"; // Single store for all key-value pairs

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Delete old stores if they exist
      if (db.objectStoreNames.contains("workflows")) {
        db.deleteObjectStore("workflows");
      }
      if (db.objectStoreNames.contains("selectedWorkflow")) {
        db.deleteObjectStore("selectedWorkflow");
      }
      // Create new store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// One connection per IndexedDB factory, reused for all reads and writes
let connection: { factory: IDBFactory; db: Promise<IDBDatabase> } | undefined;
const getDB = () => {
  if (connection?.factory !== indexedDB) {
    const db = openDB();
    connection = { factory: indexedDB, db };
    db.catch(() => {
      connection = undefined;
    });
  }
  return connection.db;
};

export const loadFromDB = async <T>(key: string): Promise<T | null> => {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get(key);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const saveToDB = async <T>(key: string, value: T): Promise<void> => {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put(value, key);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

type Update<T> = T | ((prev: T) => T);

/**
 * Persists a value in IndexedDB. Every change is saved, including a change
 * back to the default. Changes made before the stored value has loaded are
 * applied on top of it instead of being lost or overwriting it.
 * @param key - The key to store the value under.
 * @param defaultValue - The value until something is stored.
 * @returns A getter and a setter, like a signal.
 */
export const useIndexedDB = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = createSignal<T>(defaultValue);
  let loaded = false;
  const pending: ((prev: T) => T)[] = [];

  const persist = (next: T) =>
    saveToDB(key, next).catch((error) =>
      console.error(`Error saving ${key} to IndexedDB:`, error)
    );

  const set = (next: Update<T>): T => {
    const update =
      typeof next === "function" ? (next as (prev: T) => T) : () => next;
    if (!loaded) pending.push(update);
    const result = setValue((prev) => update(prev));
    if (loaded) persist(result);
    return result;
  };

  onMount(async () => {
    try {
      const stored = await loadFromDB<T>(key);
      if (stored !== null) {
        const merged = pending.reduce<T>(
          (prev, update) => update(prev),
          stored
        );
        setValue((() => merged) as Parameters<typeof setValue>[0]);
      }
      if (pending.length > 0) persist(value());
    } catch (error) {
      console.error(`Error loading ${key} from IndexedDB:`, error);
    } finally {
      loaded = true;
      pending.length = 0;
    }
  });

  return [value, set] as const;
};
