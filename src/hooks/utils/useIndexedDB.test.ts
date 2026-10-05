import { createRoot } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockIndexedDB } from "./__mocks__/indexedDB";
import { loadFromDB, openDB, saveToDB, useIndexedDB } from "./useIndexedDB";

describe("useIndexedDB", () => {
  let mockControl: ReturnType<typeof createMockIndexedDB>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup IndexedDB mock
    mockControl = createMockIndexedDB();
    globalThis.indexedDB = mockControl.mockIndexedDB as unknown as IDBFactory;

    // Clear any stored data
    mockControl.clearStoreData();
    mockControl.clearError();
  });

  describe("openDB", () => {
    it("should open IndexedDB successfully", async () => {
      const db = await openDB();

      expect(globalThis.indexedDB.open).toHaveBeenCalledWith(
        "VolcanoWorkflowDB",
        3
      );
      expect(db).toBeDefined();
    });

    it("should handle database open error", async () => {
      mockControl.setError("Failed to open DB");

      await expect(openDB()).rejects.toThrow("Failed to open DB");
    });

    it("should handle upgrade needed event", async () => {
      mockControl.setTriggerUpgrade(true);

      await openDB();

      // Verify old stores were deleted
      expect(mockControl.mockDB.deleteObjectStore).toHaveBeenCalledWith(
        "workflows"
      );
      expect(mockControl.mockDB.deleteObjectStore).toHaveBeenCalledWith(
        "selectedWorkflow"
      );

      // Verify new store was created
      expect(mockControl.mockDB.createObjectStore).toHaveBeenCalledWith(
        "keyValueStore"
      );
    });
  });

  describe("loadFromDB", () => {
    it("should load value from DB successfully", async () => {
      const testKey = "testKey";
      const testValue = { foo: "bar" };

      // Pre-populate the store
      mockControl.getStoreData().set(testKey, testValue);

      const result = await loadFromDB(testKey);

      expect(result).toEqual(testValue);
    });

    it("should return null when key does not exist", async () => {
      const testKey = "nonExistentKey";

      const result = await loadFromDB(testKey);

      expect(result).toBeNull();
    });

    it("should load primitive values", async () => {
      const testKey = "counter";
      const testValue = 42;

      mockControl.getStoreData().set(testKey, testValue);

      const result = await loadFromDB<number>(testKey);

      expect(result).toBe(testValue);
    });

    it("should load arrays", async () => {
      const testKey = "items";
      const testValue = [1, 2, 3, 4, 5];

      mockControl.getStoreData().set(testKey, testValue);

      const result = await loadFromDB<number[]>(testKey);

      expect(result).toEqual(testValue);
    });
  });

  describe("saveToDB", () => {
    it("should save value to DB successfully", async () => {
      const testKey = "testKey";
      const testValue = { foo: "bar", count: 42 };

      await saveToDB(testKey, testValue);

      // Verify it was saved
      const saved = mockControl.getStoreData().get(testKey);
      expect(saved).toEqual(testValue);
    });

    it("should save primitive values", async () => {
      const testKey = "counter";
      const testValue = 42;

      await saveToDB(testKey, testValue);

      const saved = mockControl.getStoreData().get(testKey);
      expect(saved).toBe(testValue);
    });

    it("should save arrays", async () => {
      const testKey = "items";
      const testValue = [1, 2, 3, 4, 5];

      await saveToDB(testKey, testValue);

      const saved = mockControl.getStoreData().get(testKey);
      expect(saved).toEqual(testValue);
    });

    it("should save strings", async () => {
      const testKey = "username";
      const testValue = "JohnDoe";

      await saveToDB(testKey, testValue);

      const saved = mockControl.getStoreData().get(testKey);
      expect(saved).toBe(testValue);
    });

    it("should overwrite existing values", async () => {
      const testKey = "counter";

      await saveToDB(testKey, 10);
      expect(mockControl.getStoreData().get(testKey)).toBe(10);

      await saveToDB(testKey, 20);
      expect(mockControl.getStoreData().get(testKey)).toBe(20);
    });
  });

  describe("useIndexedDB hook", () => {
    // Lets the mocked IndexedDB (setTimeout based) finish its work
    const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

    const mount = <T>(key: string, defaultValue: T) => {
      let hook!: ReturnType<typeof useIndexedDB<T>>;
      const dispose = createRoot((dispose) => {
        hook = useIndexedDB(key, defaultValue);
        return dispose;
      });
      return { hook, dispose };
    };

    it("loads the stored value", async () => {
      await saveToDB("list", [1, 2]);
      const { hook, dispose } = mount<number[]>("list", []);
      await settle();
      expect(hook[0]()).toEqual([1, 2]);
      dispose();
    });

    it("saves a change back to the default value", async () => {
      await saveToDB("selected", "a");
      const { hook, dispose } = mount("selected", "");
      await settle();
      hook[1]("");
      await settle();
      expect(mockControl.getStoreData().get("selected")).toBe("");
      dispose();
    });

    it("applies changes made before loading on top of the stored value", async () => {
      await saveToDB("history", [1, 2]);
      const { hook, dispose } = mount<number[]>("history", []);
      hook[1]((prev) => [...prev, 3]);
      await settle();
      expect(hook[0]()).toEqual([1, 2, 3]);
      expect(mockControl.getStoreData().get("history")).toEqual([1, 2, 3]);
      dispose();
    });

    it("does not store the default before anything changed", async () => {
      const { dispose } = mount("untouched", "default");
      await settle();
      expect(mockControl.getStoreData().has("untouched")).toBe(false);
      dispose();
    });
  });
});
