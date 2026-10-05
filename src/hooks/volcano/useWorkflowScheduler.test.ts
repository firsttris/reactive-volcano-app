import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkflowStep } from "../../utils/workflowData";
import { useWorkflowScheduler } from "./useWorkflowScheduler";

// A Volcano whose temperature the tests set by hand
const volcano = vi.hoisted(() => {
  const device = {
    state: { currentTemp: 20, targetTemp: 180 },
    heating: false,
    pump: false,
    log: [] as string[],
  };
  return {
    device,
    store: {
      state: device.state,
      derived: {
        isHeating: () => device.heating,
        isPumpActive: () => device.pump,
      },
      actions: {
        applyTargetTemp: async (celsius: number) => {
          device.state.targetTemp = celsius;
          device.log.push(`target ${celsius}`);
        },
        setHeater: async (on: boolean) => {
          device.heating = on;
          device.log.push(`heater ${on ? "on" : "off"}`);
        },
        setPump: async (on: boolean) => {
          device.pump = on;
          device.log.push(`pump ${on ? "on" : "off"}`);
        },
      },
    },
  };
});

vi.mock("../../provider/VolcanoProvider", () => ({
  useVolcano: () => volcano.store,
}));

const step = (
  temperature: number,
  holdTimeInSeconds = 0,
  pumpTimeInSeconds = 5
): WorkflowStep => ({
  id: `${temperature}`,
  temperature,
  holdTimeInSeconds,
  pumpTimeInSeconds,
});

describe("useWorkflowScheduler", () => {
  const { device } = volcano;
  let dispose: () => void;

  const start = (steps: WorkflowStep[]) => {
    let scheduler!: ReturnType<typeof useWorkflowScheduler>;
    dispose = createRoot((dispose) => {
      scheduler = useWorkflowScheduler(() => steps);
      return dispose;
    });
    const run = scheduler.startWorkflow();
    return { scheduler, run };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    device.state.currentTemp = 20;
    device.heating = false;
    device.pump = false;
    device.log = [];
  });

  afterEach(() => {
    dispose?.();
    vi.useRealTimers();
  });

  it("heats, holds and pumps each step in order, then switches off", async () => {
    const { scheduler, run } = start([step(180, 10, 5), step(200, 0, 8)]);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(scheduler.phase()).toEqual({ type: "heating", targetTemp: 180 });
    expect(device.heating).toBe(true);

    device.state.currentTemp = 179.5;
    await vi.advanceTimersByTimeAsync(1_500);
    expect(scheduler.phase()?.type).toBe("holding");
    expect(device.pump).toBe(false);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(device.pump).toBe(true);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(device.pump).toBe(false);
    expect(scheduler.currentStep()).toBe(1);

    device.state.currentTemp = 200;
    await vi.advanceTimersByTimeAsync(2_500 + 8_000);
    await run;

    expect(device.log).toEqual([
      "target 180",
      "heater on",
      "pump on",
      "pump off",
      "target 200",
      "pump on",
      "pump off",
      "heater off",
    ]);
    expect(scheduler.isRunning()).toBe(false);
  });

  it("raises a step below the Volcano minimum to 40 °C", async () => {
    const { scheduler } = start([step(0)]);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(scheduler.phase()).toEqual({ type: "heating", targetTemp: 40 });
    expect(device.state.targetTemp).toBe(40);
  });

  it("stops when the heater is switched off on the device", async () => {
    const { scheduler, run } = start([step(180)]);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(device.heating).toBe(true);

    device.heating = false;
    await vi.advanceTimersByTimeAsync(3 * 1_500);
    await run;

    expect(scheduler.isRunning()).toBe(false);
    expect(device.log).not.toContain("pump on");
  });

  it("gives up if the target is not reached within 20 minutes", async () => {
    const { scheduler, run } = start([step(230)]);
    await vi.advanceTimersByTimeAsync(19 * 60_000);
    expect(scheduler.isRunning()).toBe(true);

    await vi.advanceTimersByTimeAsync(2 * 60_000);
    await run;
    expect(scheduler.isRunning()).toBe(false);
    expect(device.heating).toBe(false);
  });

  it("does not pump after being stopped during the hold", async () => {
    const { scheduler } = start([step(180, 30)]);
    device.state.currentTemp = 180;
    await vi.advanceTimersByTimeAsync(2_500);
    expect(scheduler.phase()?.type).toBe("holding");

    await scheduler.stopWorkflow();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(device.log).not.toContain("pump on");
    expect(device.heating).toBe(false);
  });
});
