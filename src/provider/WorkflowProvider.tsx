import { Component, createContext, createSignal, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { useCharacteristics } from "./CharacteristicsProvider";
import { WorkflowStep } from "./../utils/workflowData";

const delayFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface WorkflowContextType {
  toggleWorkflow: () => void;
  workflow: () => WorkflowStep[];
  editWorkflow: (workflowIndex: number, workFlowStep: WorkflowStep) => void;
  deleteWorkflow: (workflowIndex: number) => void;
  addWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextType>({
  toggleWorkflow: () => {},
  workflow: () => [],
  editWorkflow: () => {},
  deleteWorkflow: () => {},
  addWorkflow: () => {},
});

interface WorkflowProviderProps {
  children: JSX.Element;
}

export const WorkflowProvider: Component<WorkflowProviderProps> = (props) => {
  const [workflow, setWorkflow] = createSignal<WorkflowStep[]>([]);

  const editWorkflow = (workflowIndex: number, workFlowStep: WorkflowStep) => {
    setWorkflow(prevWorkflow => [
      ...prevWorkflow.slice(0, workflowIndex),
      workFlowStep,
      ...prevWorkflow.slice(workflowIndex + 1)
    ]);
  };

  const deleteWorkflow = (workflowIndex: number) => {
    setWorkflow(prevWorkflow => [
      ...prevWorkflow.slice(0, workflowIndex),
      ...prevWorkflow.slice(workflowIndex + 1)
    ]);
  }

  const addWorkflow = () => {
    setWorkflow(prevWorkflow => [
      ...prevWorkflow,
      { temperature: 180, holdTimeInSeconds: 0, pumpTimeInSeconds: 5 }
    ]);
  }

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
    const currentWorkflow = workflow();
    if(!currentWorkflow) return;
    const { temperature, holdTimeInSeconds, pumpTimeInSeconds } =
    currentWorkflow[currentStep()];

    await activeHeatAndSetTargetTemperature(temperature);
    await monitorTemperaturUntilTarget();
    await activatePumpAfterDelay(holdTimeInSeconds);
    await disablePumpAfterDeplay(pumpTimeInSeconds);
    await executeNextWorkflowStep(currentWorkflow.length);
  };

  return (
    <WorkflowContext.Provider value={{ toggleWorkflow, workflow, addWorkflow, editWorkflow, deleteWorkflow }}>
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
