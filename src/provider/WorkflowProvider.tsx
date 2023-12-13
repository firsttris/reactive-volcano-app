import {
  Component,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import type { JSX } from "solid-js";
import { useCharacteristics } from "./CharacteristicsProvider";
import {
  Workflow,
  WorkflowStep,
  initialListOfWorkflows,
} from "./../utils/workflowData";
import { useParams } from "@solidjs/router";
import { v4 as uuidv4 } from "uuid";

const delayFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface WorkflowContextType {
  toggleWorkflow: () => void;
  workflow: () => WorkflowStep[];
  editWorkflow: (workflowIndex: number, workFlow: Workflow) => void;
  deleteWorkflow: (workflowIndex: number) => void;
  addWorkflow: () => void;
  deleteWorkflowStep: (
    workflowIndex: number,
    workflowStepIndex: number
  ) => void;
  addWorkflowStep: (workflowIndex: number) => void;
  editWorkflowStep: (
    workflowIndex: number,
    workflowStepIndex: number,
    workFlowStep: WorkflowStep
  ) => void;
  workflowListIndex: () => number;
  workflowStep: () => WorkflowStep;
  workflowStepIndex: () => number;
  workflowList: () => Workflow[];
}

const WorkflowContext = createContext<WorkflowContextType>({
  toggleWorkflow: () => {},
  workflow: () => [],
  editWorkflow: () => {},
  deleteWorkflow: () => {},
  addWorkflow: () => {},
  deleteWorkflowStep: () => {},
  addWorkflowStep: () => {},
  editWorkflowStep: () => {},
  workflowListIndex: () => 0,
  workflowStep: () => ({ temperature: 0, holdTimeInSeconds: 0, pumpTimeInSeconds: 0 }),
  workflowStepIndex: () => 0,
  workflowList: () => [],
});

interface WorkflowProviderProps {
  children: JSX.Element;
}

export const WorkflowProvider: Component<WorkflowProviderProps> = (props) => {
  const [workflowList, setWorkflowList] = createSignal<Workflow[]>(
    initialListOfWorkflows
  );

  const { workflowListIndex, workflowStepIndex } = useParams();

  const workflow = createMemo(() => {
    return (
      workflowList()[Number(workflowListIndex)].workflow ?? []
    );
  });

  const workflowStep = createMemo(() => {
    return workflow()[Number(workflowStepIndex)];
  });

  const deleteWorkflow = (workflowIndex: number) => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList.slice(0, workflowIndex),
      ...prevWorkflowList.slice(workflowIndex + 1),
    ]);
  };

  const deleteWorkflowStep = (
    workflowIndex: number,
    workflowStepIndex: number
  ) => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList.slice(0, workflowIndex),
      {
        ...prevWorkflowList[workflowIndex],
        workflow: [
          ...prevWorkflowList[workflowIndex].workflow.slice(
            0,
            workflowStepIndex
          ),
          ...prevWorkflowList[workflowIndex].workflow.slice(
            workflowStepIndex + 1
          ),
        ],
      },
      ...prevWorkflowList.slice(workflowIndex + 1),
    ]);
  };

  const addWorkflow = () => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList,
      { name: "New", id: uuidv4(), workflow: [] },
    ]);
  };

  const addWorkflowStep = (workflowIndex: number) => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList.slice(0, workflowIndex),
      {
        ...prevWorkflowList[workflowIndex],
        workflow: [
          ...prevWorkflowList[workflowIndex].workflow,
          { temperature: 180, holdTimeInSeconds: 0, pumpTimeInSeconds: 5 },
        ],
      },
      ...prevWorkflowList.slice(workflowIndex + 1),
    ]);
  };

  const editWorkflow = (workflowIndex: number, workFlow: Workflow) => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList.slice(0, workflowIndex),
      workFlow,
      ...prevWorkflowList.slice(workflowIndex + 1),
    ]);
  };

  const editWorkflowStep = (
    workflowIndex: number,
    workflowStepIndex: number,
    workFlowStep: WorkflowStep
  ) => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList.slice(0, workflowIndex),
      {
        ...prevWorkflowList[workflowIndex],
        workflow: [
          ...prevWorkflowList[workflowIndex].workflow.slice(
            0,
            workflowStepIndex
          ),
          workFlowStep,
          ...prevWorkflowList[workflowIndex].workflow.slice(
            workflowStepIndex + 1
          ),
        ],
      },
      ...prevWorkflowList.slice(workflowIndex + 1),
    ]);
  };

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
        workflow,
        workflowListIndex: () => Number(workflowListIndex),
        workflowStepIndex: () => Number(workflowStepIndex),
        workflowStep,
        addWorkflow,
        editWorkflow,
        deleteWorkflow,
        deleteWorkflowStep,
        addWorkflowStep,
        editWorkflowStep,
        workflowList
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
