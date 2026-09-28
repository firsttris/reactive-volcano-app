import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncedWriter } from "./debouncedWriter";

describe("createDebouncedWriter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const create = () =>
    createDebouncedWriter<"temp" | "boost">({
      debounceMs: 500,
      holdAfterWriteMs: 1500,
    });

  it("only performs the last write of a burst", async () => {
    const writer = create();
    const writes: number[] = [];
    for (const value of [180, 181, 182]) {
      writer.schedule("temp", async () => {
        writes.push(value);
      });
      await vi.advanceTimersByTimeAsync(200);
    }
    await vi.advanceTimersByTimeAsync(500);
    expect(writes).toEqual([182]);
  });

  it("holds the value while pending and shortly after the write", async () => {
    const writer = create();
    writer.schedule("temp", async () => {});
    expect(writer.isHeld("temp")).toBe(true);

    await vi.advanceTimersByTimeAsync(500);
    expect(writer.isHeld("temp")).toBe(true);

    await vi.advanceTimersByTimeAsync(1500);
    expect(writer.isHeld("temp")).toBe(false);
  });

  it("handles keys independently", async () => {
    const writer = create();
    const write = vi.fn(async () => {});
    writer.schedule("temp", write);
    writer.schedule("boost", write);
    expect(writer.isHeld("boost")).toBe(true);
    await vi.advanceTimersByTimeAsync(500);
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("releases the hold even if the write fails", async () => {
    const writer = create();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    writer.schedule("temp", async () => {
      throw new Error("GATT error");
    });
    await vi.advanceTimersByTimeAsync(2000);
    expect(writer.isHeld("temp")).toBe(false);
    consoleError.mockRestore();
  });

  it("cancels pending writes on dispose", async () => {
    const writer = create();
    const write = vi.fn(async () => {});
    writer.schedule("temp", write);
    writer.dispose();
    await vi.advanceTimersByTimeAsync(1000);
    expect(write).not.toHaveBeenCalled();
    expect(writer.isHeld("temp")).toBe(false);
  });
});
