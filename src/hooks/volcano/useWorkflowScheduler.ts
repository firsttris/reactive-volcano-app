import { type Accessor, createSignal, onCleanup } from "solid-js";
import { clamp, Limits } from "../../devices/volcano/protocol";
import { useVolcano } from "../../provider/VolcanoProvider";
import type { WorkflowStep } from "../../utils/workflowData";

// The pump always runs for at least this long
const MIN_PUMP_TIME_MS = 500;
const TEMP_CHECK_INTERVAL_MS = 1_500;
// Heating up from cold takes a few minutes; far longer means something's off
const MAX_HEATING_TIME_MS = 20 * 60_000;
// Checks in a row with the heater off before the run counts as interrupted;
// the register may lag behind right after switching it on
const HEATER_OFF_CHECKS = 3;

export type WorkflowPhase =
  | { type: "heating"; targetTemp: number }
  | { type: "holding" | "pumping"; endsAt: number };

class WorkflowCancelledError extends Error {
  constructor() {
    super("Workflow cancelled");
  }
}

/** The heater went off or the target was not reached in time */
class WorkflowInterruptedError extends Error {}

export const useWorkflowScheduler = (
  getWorkflowSteps: Accessor<WorkflowStep[]>
) => {
  const [currentStep, setCurrentStep] = createSignal(0);
  const [isRunning, setIsRunning] = createSignal(false);
  const [phase, setPhase] = createSignal<WorkflowPhase>();

  const { state, actions, derived } = useVolcano();
  const getCurrentTemperature = () => state.currentTemp;
  const setTargetTemperature = actions.applyTargetTemp;
  const isPumpActive = derived.isPumpActive;
  const isHeatingActive = derived.isHeating;
  const setPumpOn = () => actions.setPump(true);
  const setPumpOff = () => actions.setPump(false);
  const setHeatOn = () => actions.setHeater(true);
  const setHeatOff = () => actions.setHeater(false);

  // Each run gets its own id; stopping invalidates the running one
  let runId = 0;
  const pendingCancels = new Set<() => void>();

  const cancelRun = () => {
    runId++;
    for (const cancel of pendingCancels) cancel();
    pendingCancels.clear();
  };

  const ensureActive = (id: number) => {
    if (id !== runId) throw new WorkflowCancelledError();
  };

  onCleanup(() => {
    cancelRun();
  });

  const delayFor = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timeout);
        reject(new WorkflowCancelledError());
      };
      const timeout = setTimeout(() => {
        pendingCancels.delete(cancel);
        resolve();
      }, ms);
      pendingCancels.add(cancel);
    });

  // Waits until the temperature is within ±1 °C of the step's target. Gives
  // up if the heater is switched off (on the device or in the app) or the
  // target is not reached in time, instead of waiting forever.
  const monitorTemperatureUntilTarget = (targetTemp: number) =>
    new Promise<void>((resolve, reject) => {
      const startedAt = Date.now();
      let heaterOffChecks = 0;
      const finish = (error?: Error) => {
        clearInterval(interval);
        pendingCancels.delete(cancel);
        if (error) reject(error);
        else resolve();
      };
      const cancel = () => {
        clearInterval(interval);
        reject(new WorkflowCancelledError());
      };
      const interval = setInterval(() => {
        const currentTemp = getCurrentTemperature();
        if (Math.abs(currentTemp - targetTemp) <= 1) {
          finish();
          return;
        }
        heaterOffChecks = isHeatingActive() ? 0 : heaterOffChecks + 1;
        if (heaterOffChecks >= HEATER_OFF_CHECKS) {
          finish(new WorkflowInterruptedError("Heater switched off"));
        } else if (Date.now() - startedAt > MAX_HEATING_TIME_MS) {
          finish(new WorkflowInterruptedError("Target not reached in time"));
        }
      }, TEMP_CHECK_INTERVAL_MS);
      pendingCancels.add(cancel);
    });

  const executeWorkflowStep = async (step: WorkflowStep, id: number) => {
    // The device only accepts temperatures within its limits
    const targetTemp = clamp(
      step.temperature,
      Limits.MIN_TEMP,
      Limits.MAX_TEMP
    );
    setPhase({ type: "heating", targetTemp });
    await setTargetTemperature(targetTemp);
    ensureActive(id);

    // Wait a bit before turning on heat
    await delayFor(750);

    if (!isHeatingActive()) {
      await setHeatOn();
      ensureActive(id);
    }

    // Wait for temperature to be reached
    await monitorTemperatureUntilTarget(targetTemp);
    ensureActive(id);

    // Hold time (wait before activating pump)
    if (step.holdTimeInSeconds > 0) {
      setPhase({
        type: "holding",
        endsAt: Date.now() + step.holdTimeInSeconds * 1000,
      });
      await delayFor(step.holdTimeInSeconds * 1000);
    }

    // Activate pump
    const pumpTimeMs = Math.max(
      MIN_PUMP_TIME_MS,
      step.pumpTimeInSeconds * 1000
    );
    if (!isPumpActive()) {
      await setPumpOn();
      ensureActive(id);
    }

    // Wait for pump time, then turn off
    setPhase({ type: "pumping", endsAt: Date.now() + pumpTimeMs });
    await delayFor(pumpTimeMs);

    if (isPumpActive()) {
      await setPumpOff();
      ensureActive(id);
    }
  };

  const runRemainingSteps = async (id: number) => {
    try {
      while (currentStep() < getWorkflowSteps().length) {
        await executeWorkflowStep(getWorkflowSteps()[currentStep()], id);
        ensureActive(id);
        setCurrentStep((prev) => prev + 1);
      }
      await stopWorkflow();
    } catch (error) {
      if (error instanceof WorkflowCancelledError) return;
      // Interrupted or failed: switch everything off rather than wait
      console.error("Workflow error:", error);
      await stopWorkflow();
    }
  };

  const startWorkflow = async () => {
    const workflowSteps = getWorkflowSteps();
    if (!workflowSteps || workflowSteps.length === 0) {
      console.error("No workflow steps defined");
      return;
    }

    cancelRun();
    setIsRunning(true);
    setCurrentStep(0);

    await runRemainingSteps(runId);
  };

  const stopWorkflow = async () => {
    cancelRun();
    setIsRunning(false);
    setCurrentStep(0);
    setPhase(undefined);

    // Turn off heat and pump
    if (isHeatingActive()) {
      await setHeatOff();
    }
    if (isPumpActive()) {
      await setPumpOff();
    }
  };

  return {
    startWorkflow,
    stopWorkflow,
    currentStep,
    isRunning,
    phase,
  };
};
