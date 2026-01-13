import { describe, it, expect, beforeEach, vi } from "vitest";
import { openDB, loadFromDB, saveToDB } from "./useIndexedDB";
import { createMockIndexedDB } from "./__mocks__/indexedDB";

describe("useIndexedDB", () => {
  let mockControl: ReturnType<typeof createMockIndexedDB>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup IndexedDB mock
    mockControl = createMockIndexedDB();
    globalThis.indexedDB = mockControl.mockIndexedDB as any;

    // Clear any stored data
    mockControl.clearStoreData();
    mockControl.clearError();
  });

  describe("openDB", () => {
    it("should open IndexedDB successfully", async () => {
      const db = await openDB();

      expect(globalThis.indexedDB.open).toHaveBeenCalledWith("VolcanoWorkflowDB", 3);
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
      expect(mockControl.mockDB.deleteObjectStore).toHaveBeenCalledWith("workflows");
      expect(mockControl.mockDB.deleteObjectStore).toHaveBeenCalledWith("selectedWorkflow");
      
      // Verify new store was created
      expect(mockControl.mockDB.createObjectStore).toHaveBeenCalledWith("keyValueStore");
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
});
