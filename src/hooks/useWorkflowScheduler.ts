import { Accessor, createSignal } from "solid-js";
import { useCharacteristics } from "../provider/CharacteristicsProvider";
import { WorkflowStep } from "../utils/workflowData";

const delayFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const useWorkflowScheduler = (getWorkflowSteps: Accessor<WorkflowStep[]>) => {

    const [currentStep, setCurrentStep] = createSignal(0);
    const {
      getters: { getCurrentTemperature, getTargetTemperature },
      setters: {
        setTargetTemperature,
        setPumpOn,
        setPumpOff,
        setHeatOn,
        setHeatOff,
      },
    } = useCharacteristics();

  
    const monitorTemperaturUntilTarget = () =>
      new Promise((resolve) => {
        const interval = setInterval(() => {
          if (getCurrentTemperature() >= getTargetTemperature()) {
            clearInterval(interval);
            resolve(null);
          }
        }, 1000);
      });
  
    const activatePumpAfterDelay = async (holdTimeInSec: number) => {
      await delayFor(holdTimeInSec * 1000);
      await setPumpOn();
    };
  
    const disablePumpAfterDeplay = async (pumpTimeInSec: number) => {
      await delayFor(pumpTimeInSec * 1000);
      await setPumpOff();
    };
  
    const executeNextWorkflowStep = async (workflowLenth: number) => {
      setCurrentStep((prevStep) => prevStep + 1);
      if (currentStep() < workflowLenth) {
        startWorkflow();
      } else {
        await setHeatOff();
        // what todo if the workflow is finished?
      }
    };
  
    const activeHeatAndSetTargetTemperature = async (temperature: number) => {
      await setTargetTemperature(temperature);
      await setHeatOn();
    };
  
    const startWorkflow = async () => {
        const workflowSteps = getWorkflowSteps();
      if (!workflowSteps || workflowSteps.length === 0) {
        console.error("No workflow steps defined");
        return;
      }
      const { temperature, holdTimeInSeconds, pumpTimeInSeconds } =
      workflowSteps[currentStep()];
  
      await activeHeatAndSetTargetTemperature(temperature);
      await monitorTemperaturUntilTarget();
      await activatePumpAfterDelay(holdTimeInSeconds);
      await disablePumpAfterDeplay(pumpTimeInSeconds);
      await executeNextWorkflowStep(workflowSteps.length);
    };

    return { startWorkflow, currentStep }
}