import { createEffect, createSignal, onMount } from "solid-js";

// IndexedDB setup (shared across the app)
const DB_NAME = "VolcanoWorkflowDB";
const DB_VERSION = 2; // Increased version to upgrade the database
const STORE_NAME = "keyValueStore"; // Single store for all key-value pairs

const openDB = (): Promise<IDBDatabase> => {
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

const loadFromDB = async <T>(key: string): Promise<T | null> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get(key);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

const saveToDB = async <T>(key: string, value: T): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put(value, key);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * Generic hook for persisting a value in IndexedDB.
 * Automatically detects if it's an object or primitive.
 * @param key - The key to store the value under.
 * @param defaultValue - The default value if nothing is stored.
 * @returns A signal for the value.
 */
export const useIndexedDB = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = createSignal<T>(defaultValue);

  onMount(async () => {
    try {
      const loaded = await loadFromDB<T>(key);
      if (loaded !== null) {
        (setValue as (value: T) => void)(loaded);
      }
    } catch (error) {
      console.error(`Error loading ${key} from IndexedDB:`, error);
    }
  });

  createEffect(() => {
    const val = value();
    saveToDB(key, val).catch((error) =>
      console.error(`Error saving ${key} to IndexedDB:`, error)
    );
  });

  return [value, setValue] as const;
};
