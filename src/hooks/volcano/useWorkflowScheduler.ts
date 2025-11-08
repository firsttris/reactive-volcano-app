import { Accessor, createSignal, onCleanup } from "solid-js";
import { useVolcanoDeviceContext } from "../../provider/VolcanoDeviceProvider";
import { WorkflowStep } from "../../utils/workflowData";

const delayFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

  let monitorInterval: number | null = null;
  let holdTimeout: number | null = null;
  let pumpTimeout: number | null = null;

  const clearAllTimers = () => {
    if (monitorInterval) clearInterval(monitorInterval);
    if (holdTimeout) clearTimeout(holdTimeout);
    if (pumpTimeout) clearTimeout(pumpTimeout);
    monitorInterval = null;
    holdTimeout = null;
    pumpTimeout = null;
  };

  onCleanup(() => {
    clearAllTimers();
  });

  // Monitor temperature until it reaches target (within ±1°C tolerance)
  const monitorTemperatureUntilTarget = () =>
    new Promise<void>((resolve) => {
      const targetTemp = getTargetTemperature();

      monitorInterval = setInterval(() => {
        const currentTemp = getCurrentTemperature();
        // Temperature reached if within ±1°C of target (like legacy app)
        if (currentTemp >= targetTemp - 1 && currentTemp <= targetTemp + 1) {
          if (monitorInterval) clearInterval(monitorInterval);
          monitorInterval = null;
          console.log(
            `Temperature reached: ${currentTemp}°C (target: ${targetTemp}°C)`
          );
          resolve();
        }
      }, 1500); // Check every 1.5 seconds like legacy app
    });

  const executeWorkflowStep = async (step: WorkflowStep) => {
    console.log(`Executing step ${currentStep() + 1}:`, step);

    // Set target temperature and turn on heater
    await setTargetTemperature(step.temperature);

    // Wait a bit before turning on heat (like legacy app)
    await delayFor(750);

    if (!isHeatingActive()) {
      await setHeatOn();
    }

    // Wait for temperature to be reached
    await monitorTemperatureUntilTarget();

    // Hold time (wait before activating pump)
    if (step.holdTimeInSeconds > 0) {
      console.log(`Holding for ${step.holdTimeInSeconds} seconds...`);
      await delayFor(step.holdTimeInSeconds * 1000);
    }

    // Activate pump
    if (step.pumpTimeInSeconds > 0) {
      console.log(`Activating pump for ${step.pumpTimeInSeconds} seconds...`);
      if (!isPumpActive()) {
        await setPumpOn();
      }

      // Wait for pump time, then turn off
      await delayFor(step.pumpTimeInSeconds * 1000);

      if (isPumpActive()) {
        await setPumpOff();
      }
    }
  };

  const executeNextStep = async () => {
    const workflowSteps = getWorkflowSteps();
    const step = currentStep();

    if (step >= workflowSteps.length) {
      // Workflow finished
      console.log("Workflow completed!");
      await stopWorkflow();
      return;
    }

    await executeWorkflowStep(workflowSteps[step]);

    // Move to next step
    setCurrentStep((prev) => prev + 1);

    // Continue with next step if not at the end
    if (currentStep() < workflowSteps.length) {
      await executeNextStep();
    }
  };

  const startWorkflow = async () => {
    const workflowSteps = getWorkflowSteps();
    if (!workflowSteps || workflowSteps.length === 0) {
      console.error("No workflow steps defined");
      return;
    }

    console.log("Starting workflow with", workflowSteps.length, "steps");
    setIsRunning(true);
    setIsPaused(false);
    setCurrentStep(0);

    try {
      await executeNextStep();
    } catch (error) {
      console.error("Workflow error:", error);
      await stopWorkflow();
    }
  };

  const stopWorkflow = async () => {
    console.log("Stopping workflow");
    clearAllTimers();
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

  const pauseWorkflow = () => {
    console.log("Pausing workflow");
    clearAllTimers();
    setIsPaused(true);
  };

  const resumeWorkflow = async () => {
    console.log("Resuming workflow");
    setIsPaused(false);
    await executeNextStep();
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
