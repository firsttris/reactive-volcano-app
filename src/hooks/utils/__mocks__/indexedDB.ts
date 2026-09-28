import { vi } from "vitest";

/**
 * Creates a mock IndexedDB implementation for testing.
 * This mock simulates the async behavior of IndexedDB operations.
 */
type MockRequest<T> = {
  result?: T;
  error: Error | null;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
};

const createRequest = <T>(result?: T): MockRequest<T> => ({
  result,
  error: null,
  onsuccess: null,
  onerror: null,
});

export const createMockIndexedDB = () => {
  let shouldTriggerUpgrade = false;
  let shouldError = false;
  let errorMessage = "";
  const storeData = new Map<string, unknown>();

  const MockIDBObjectStore = {
    get: (key: string) => {
      const request = createRequest<unknown>();
      setTimeout(() => {
        request.result = storeData.get(key);
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    },
    put: (value: unknown, key: string) => {
      storeData.set(key, value);
      const request = createRequest<unknown>();
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

  const mockDB = {
    objectStoreNames: {
      contains: (name: string) => {
        return (
          shouldTriggerUpgrade &&
          (name === "workflows" || name === "selectedWorkflow")
        );
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
      const request = {
        ...createRequest(mockDB),
        onupgradeneeded: null as
          | ((event: { target: { result: typeof mockDB } }) => void)
          | null,
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
    setTriggerUpgrade: (value: boolean) => {
      shouldTriggerUpgrade = value;
    },
    setError: (message: string) => {
      shouldError = !!message;
      errorMessage = message;
    },
    clearError: () => {
      shouldError = false;
      errorMessage = "";
    },
    getStoreData: () => storeData,
    clearStoreData: () => {
      storeData.clear();
    },
  };
};
