import { vi } from "vitest";

/**
 * Creates a mock IndexedDB implementation for testing.
 * This mock simulates the async behavior of IndexedDB operations.
 */
export const createMockIndexedDB = () => {
  let mockDB: any;
  let shouldTriggerUpgrade = false;
  let shouldError = false;
  let errorMessage = "";
  let storeData: Map<string, any> = new Map();

  const MockIDBObjectStore = {
    get: (key: string) => {
      const request: any = {};
      setTimeout(() => {
        request.result = storeData.get(key);
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    },
    put: (value: any, key: string) => {
      storeData.set(key, value);
      const request: any = {};
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    },
  };

  const MockIDBTransaction = {
    objectStore: vi.fn(() => MockIDBObjectStore),
    oncomplete: null as (() => void) | null,
    onerror: null as (() => void) | null,
    error: null as Error | null,
  };

  mockDB = {
    objectStoreNames: {
      contains: (name: string) => {
        return shouldTriggerUpgrade && (name === "workflows" || name === "selectedWorkflow");
      },
    },
    createObjectStore: vi.fn(),
    deleteObjectStore: vi.fn(),
    transaction: vi.fn(() => {
      const transaction = { ...MockIDBTransaction };
      setTimeout(() => {
        if (shouldError && transaction.onerror) {
          transaction.error = new Error(errorMessage);
          transaction.onerror();
        } else if (transaction.oncomplete) {
          transaction.oncomplete();
        }
      }, 0);
      return transaction;
    }),
  };

  const mockIndexedDB = {
    open: vi.fn(() => {
      const request: any = {
        result: mockDB,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      setTimeout(() => {
        if (shouldTriggerUpgrade && request.onupgradeneeded) {
          request.onupgradeneeded({ target: { result: mockDB } });
        }
        
        if (shouldError && request.onerror) {
          request.error = new Error(errorMessage);
          request.onerror();
        } else if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);

      return request;
    }),
  };

  return {
    mockIndexedDB,
    mockDB,
    setTriggerUpgrade: (value: boolean) => { shouldTriggerUpgrade = value; },
    setError: (message: string) => {
      shouldError = !!message;
      errorMessage = message;
    },
    clearError: () => {
      shouldError = false;
      errorMessage = "";
    },
    getStoreData: () => storeData,
    clearStoreData: () => { storeData.clear(); },
  };
};
