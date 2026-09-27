import { Accessor, createSignal, onCleanup } from "solid-js";
import { useVolcanoDeviceContext } from "../../provider/VolcanoDeviceProvider";
import { WorkflowStep } from "../../utils/workflowData";

// Like the legacy app, the pump always runs for at least this long
const MIN_PUMP_TIME_MS = 500;

class WorkflowCancelledError extends Error {
  constructor() {
    super("Workflow cancelled");
  }
}

export const useWorkflowScheduler = (
  getWorkflowSteps: Accessor<WorkflowStep[]>
) => {
  const [currentStep, setCurrentStep] = createSignal(0);
  const [isRunning, setIsRunning] = createSignal(false);
  const [isPaused, setIsPaused] = createSignal(false);

  const { temperature, deviceStatus } = useVolcanoDeviceContext();
  const { getCurrentTemperature, getTargetTemperature, setTargetTemperature } =
    temperature;
  const {
    isPumpActive,
    isHeatingActive,
    setPumpOn,
    setPumpOff,
    setHeatOn,
    setHeatOff,
  } = deviceStatus;

  // Each run gets its own id; stopping or pausing invalidates the running one
  let runId = 0;
  const pendingCancels = new Set<() => void>();

  const cancelRun = () => {
    runId++;
    pendingCancels.forEach((cancel) => cancel());
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

  // Monitor temperature until it reaches target (within ±1°C tolerance)
  const monitorTemperatureUntilTarget = () =>
    new Promise<void>((resolve, reject) => {
      const targetTemp = getTargetTemperature();
      const cancel = () => {
        clearInterval(interval);
        reject(new WorkflowCancelledError());
      };
      const interval = setInterval(() => {
        const currentTemp = getCurrentTemperature();
        // Temperature reached if within ±1°C of target (like legacy app)
        if (currentTemp >= targetTemp - 1 && currentTemp <= targetTemp + 1) {
          clearInterval(interval);
          pendingCancels.delete(cancel);
          console.log(
            `Temperature reached: ${currentTemp}°C (target: ${targetTemp}°C)`
          );
          resolve();
        }
      }, 1500); // Check every 1.5 seconds like legacy app
      pendingCancels.add(cancel);
    });

  const executeWorkflowStep = async (step: WorkflowStep, id: number) => {
    console.log(`Executing step ${currentStep() + 1}:`, step);

    // Set target temperature and turn on heater
    await setTargetTemperature(step.temperature);
    ensureActive(id);

    // Wait a bit before turning on heat (like legacy app)
    await delayFor(750);

    if (!isHeatingActive()) {
      await setHeatOn();
      ensureActive(id);
    }

    // Wait for temperature to be reached
    await monitorTemperatureUntilTarget();

    // Hold time (wait before activating pump)
    if (step.holdTimeInSeconds > 0) {
      console.log(`Holding for ${step.holdTimeInSeconds} seconds...`);
      await delayFor(step.holdTimeInSeconds * 1000);
    }

    // Activate pump
    const pumpTimeMs = Math.max(
      MIN_PUMP_TIME_MS,
      step.pumpTimeInSeconds * 1000
    );
    console.log(`Activating pump for ${pumpTimeMs} ms...`);
    if (!isPumpActive()) {
      await setPumpOn();
      ensureActive(id);
    }

    // Wait for pump time, then turn off
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
      console.log("Workflow completed!");
      await stopWorkflow();
    } catch (error) {
      if (error instanceof WorkflowCancelledError) return;
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

    console.log("Starting workflow with", workflowSteps.length, "steps");
    cancelRun();
    setIsRunning(true);
    setIsPaused(false);
    setCurrentStep(0);

    await runRemainingSteps(runId);
  };

  const stopWorkflow = async () => {
    console.log("Stopping workflow");
    cancelRun();
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);

    // Turn off heat and pump
    if (isHeatingActive()) {
      await setHeatOff();
    }
    if (isPumpActive()) {
      await setPumpOff();
    }
  };

  const pauseWorkflow = async () => {
    console.log("Pausing workflow");
    cancelRun();
    setIsPaused(true);
    if (isPumpActive()) {
      await setPumpOff();
    }
  };

  const resumeWorkflow = async () => {
    console.log("Resuming workflow");
    cancelRun();
    setIsPaused(false);
    // The interrupted step is repeated from its beginning
    await runRemainingSteps(runId);
  };

  return {
    startWorkflow,
    stopWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    currentStep,
    isRunning,
    isPaused,
  };
};
