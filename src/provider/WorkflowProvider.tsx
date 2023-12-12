import { Component, createContext, createSignal, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { useCharacteristics } from "./CharacteristicsProvider";
import { workflow1 } from "./../utils/workflowData";

const delayFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface WorkflowContextType {
  toggleWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextType>({
  toggleWorkflow: () => {},
});

interface WorkflowProviderProps {
  children: JSX.Element;
}

export const WorkflowProvider: Component<WorkflowProviderProps> = (props) => {
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

  const toggleWorkflow = async () => {
    startWorkflow();
  };

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

  const disablePumpAndHeatAfterDeplay = async (pumpTimeInSec: number) => {
    await delayFor(pumpTimeInSec * 1000);
    await setPumpOff();
    await setHeatOff();
  };

  const executeNextWorkflowStep = (workflowLenth: number) => {
    setCurrentStep((prevStep) => prevStep + 1);
    if (currentStep() < workflowLenth) {
      startWorkflow();
    } else {
      // what todo if the workflow is finished?
    }
  };

  const activeHeatAndSetTargetTemperature = async (temperature: number) => {
    await setTargetTemperature(temperature);
    await setHeatOn();
  };

  const startWorkflow = async () => {
    const { temperature, holdTimeInSeconds, pumpTimeInSeconds } =
      workflow1[currentStep()];

    await activeHeatAndSetTargetTemperature(temperature);
    await monitorTemperaturUntilTarget();
    await activatePumpAfterDelay(holdTimeInSeconds);
    await disablePumpAndHeatAfterDeplay(pumpTimeInSeconds);
    executeNextWorkflowStep(workflow1.length);
  };

  return (
    <WorkflowContext.Provider value={{ toggleWorkflow }}>
      {props.children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return useContext(WorkflowContext);
};
