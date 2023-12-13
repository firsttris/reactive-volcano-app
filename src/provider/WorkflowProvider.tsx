import {
  Component,
  createContext,
  createSignal,
  useContext,
} from "solid-js";
import type { JSX } from "solid-js";
import { useCharacteristics } from "./CharacteristicsProvider";
import {
  WorkflowStep,
} from "./../utils/workflowData";


const delayFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface WorkflowContextType {
  toggleWorkflow: () => void;
  workflowSteps: () => WorkflowStep[];
  addWorkflowStep: () => void;
  editWorkflowStep: (workflowStepIndex: number, workflowStep: WorkflowStep) => void;
  deleteWorkflowStep: (workflowStepIndex: number) => void;
  setWorkflowSteps: (workflowSteps: WorkflowStep[]) => void;
}

const WorkflowContext = createContext<WorkflowContextType>({
  toggleWorkflow: () => {},
  workflowSteps: () => [],
  addWorkflowStep: () => {},
  editWorkflowStep: () => {},
  deleteWorkflowStep: () => {},
  setWorkflowSteps: () => {},
});

interface WorkflowProviderProps {
  children: JSX.Element;
}

export const WorkflowProvider: Component<WorkflowProviderProps> = (props) => {
  
  const [workflowSteps, setWorkflowSteps] = createSignal<WorkflowStep[]>([]);

  const addWorkflowStep = () => {
    setWorkflowSteps((prev) => [...prev, { temperature: 0, holdTimeInSeconds: 0, pumpTimeInSeconds: 0 }]);
  }

  const editWorkflowStep = (workflowStepIndex: number, workflowStep: WorkflowStep) => {
    setWorkflowSteps((prev) => {
      const newWorkflowSteps = [...prev];
      newWorkflowSteps[workflowStepIndex] = workflowStep;
      return newWorkflowSteps;
    });
  }
  
  const deleteWorkflowStep = (workflowStepIndex: number) => {
    setWorkflowSteps((prev) => {
      const newWorkflowSteps = [...prev];
      newWorkflowSteps.splice(workflowStepIndex, 1);
      return newWorkflowSteps;
    });
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
    const currentWorkflow = workflowSteps();
    if (!currentWorkflow) return;
    const { temperature, holdTimeInSeconds, pumpTimeInSeconds } =
      currentWorkflow[currentStep()];

    await activeHeatAndSetTargetTemperature(temperature);
    await monitorTemperaturUntilTarget();
    await activatePumpAfterDelay(holdTimeInSeconds);
    await disablePumpAfterDeplay(pumpTimeInSeconds);
    await executeNextWorkflowStep(currentWorkflow.length);
  };

  return (
    <WorkflowContext.Provider
      value={{
        toggleWorkflow,
        workflowSteps,
        addWorkflowStep,
        editWorkflowStep,
        deleteWorkflowStep,
        setWorkflowSteps
      }}
    >
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
