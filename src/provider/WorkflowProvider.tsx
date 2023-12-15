import {
  Component,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  useContext,
} from "solid-js";
import type { JSX } from "solid-js";
import { useCharacteristics } from "./CharacteristicsProvider";
import {
  Workflow,
  WorkflowStep,
  initialListOfWorkflows,
} from "./../utils/workflowData";
import { v4 as uuidv4 } from "uuid";

const delayFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface WorkflowContextType {
  toggleWorkflow: () => void;
  workflowSteps: () => WorkflowStep[];
  selectedWorkflowId: () => string;
  setSelectedWorkflowId: (workflowId: string) => void;
  addWorkflowToList: () => void;
  addWorkflowStepToWorkflow: (
    workflowId: string,
    workflowStep: WorkflowStep
  ) => void;
  deleteWorkflowFromList: (workflowId: string) => void;
  deleteWorkflowStepFromList: (
    workflowId: string,
    workflowStepId: string
  ) => void;
  editWorkflowInList: (workflowId: string, workflow: Workflow) => void;
  editWorkflowStepInList: (
    workflowId: string,
    workflowStepId: string,
    workflowStep: WorkflowStep
  ) => void;
  workflowList: () => Workflow[];
  setWorkflowList: (workflowList: Workflow[]) => void;
  updateWorkflowStepsInList: (
    workflowId: string,
    workflowSteps: WorkflowStep[]
  ) => void;
  addNewWorkflowStep: () => void;
}

const WorkflowContext = createContext<WorkflowContextType>({
  toggleWorkflow: () => {},
  workflowSteps: () => [],
  selectedWorkflowId: () => "",
  setSelectedWorkflowId: () => {},
  addWorkflowToList: () => {},
  addWorkflowStepToWorkflow: () => {},
  deleteWorkflowFromList: () => {},
  deleteWorkflowStepFromList: () => {},
  editWorkflowInList: () => {},
  editWorkflowStepInList: () => {},
  workflowList: () => [],
  setWorkflowList: () => {},
  updateWorkflowStepsInList: () => {},
  addNewWorkflowStep: () => {},
});

interface WorkflowProviderProps {
  children: JSX.Element;
}

export const WorkflowProvider: Component<WorkflowProviderProps> = (props) => {
  const [workflowList, setWorkflowList] = createSignal<Workflow[]>(
    initialListOfWorkflows
  );
  const [selectedWorkflowId, setSelectedWorkflowId] = createSignal<string>("");

  onMount(() => {
    const selectedWorkflowIdFromLocalStorage =
      localStorage.getItem("selectedWorkflowId");
    if (!selectedWorkflowIdFromLocalStorage) return;
    console.log("selectedWorkflowId", selectedWorkflowIdFromLocalStorage);
    setSelectedWorkflowId(selectedWorkflowIdFromLocalStorage);

    const workflowListFromLocalStorage = localStorage.getItem("workflowList");
    if (!workflowListFromLocalStorage) return;
    console.log("workflowList", workflowListFromLocalStorage);
    try {
      setWorkflowList(JSON.parse(workflowListFromLocalStorage));
    } catch (error) {
      console.log("error", error);
    }
  });

  createEffect(() => {
    if (selectedWorkflowId()) {
      localStorage.setItem("selectedWorkflowId", selectedWorkflowId());
    }

    if (workflowList()) {
      localStorage.setItem("workflowList", JSON.stringify(workflowList()));
    }
  });

  const workflowSteps = createMemo(() => {
    const workflow = workflowList().find(
      (workflow) => workflow.id === selectedWorkflowId()
    );
    return workflow?.workflowSteps || [];
  });

  const addWorkflowToList = () => {
    const newWorkflow: Workflow = {
      id: uuidv4(),
      name: "New Workflow",
      workflowSteps: [],
    };
    setWorkflowList([...workflowList(), newWorkflow]);
    setSelectedWorkflowId(newWorkflow.id);
  };

  const findWorkflowIndex = (workflowId: string) => {
    return workflowList().findIndex((workflow) => workflow.id === workflowId);
  };

  const addWorkflowStepToWorkflow = (
    workflowId: string,
    workflowStep: WorkflowStep
  ) => {
    const workflows = workflowList();
    const workflowIndex = findWorkflowIndex(workflowId);

    if (workflowIndex === -1) {
      console.log(`Workflow with id ${workflowId} not found`);
      return;
    }

    const workflow = workflows[workflowIndex];
    const updatedWorkflow = {
      ...workflow,
      workflowSteps: [...workflow.workflowSteps, workflowStep],
    };

    setWorkflowList([
      ...workflows.slice(0, workflowIndex),
      updatedWorkflow,
      ...workflows.slice(workflowIndex + 1),
    ]);
  };

  const deleteWorkflowFromList = (workflowId: string) => {
    const workflows = workflowList();
    const workflowIndex = findWorkflowIndex(workflowId);

    if (workflowIndex === -1) {
      console.log(`Workflow with id ${workflowId} not found`);
      return;
    }

    setWorkflowList([
      ...workflows.slice(0, workflowIndex),
      ...workflows.slice(workflowIndex + 1),
    ]);
  };

  const deleteWorkflowStepFromList = (
    workflowId: string,
    workflowStepId: string
  ) => {
    const workflows = workflowList();
    const workflowIndex = findWorkflowIndex(workflowId);

    if (workflowIndex === -1) {
      console.log(`Workflow with id ${workflowId} not found`);
      return;
    }

    const workflow = workflows[workflowIndex];
    const workflowStepIndex = workflow.workflowSteps.findIndex(
      (workflowStep) => workflowStep.id === workflowStepId
    );

    if (workflowStepIndex === -1) {
      console.log(`WorkflowStep with id ${workflowStepId} not found`);
      return;
    }

    const updatedWorkflow = {
      ...workflow,
      workflowSteps: [
        ...workflow.workflowSteps.slice(0, workflowStepIndex),
        ...workflow.workflowSteps.slice(workflowStepIndex + 1),
      ],
    };

    setWorkflowList([
      ...workflows.slice(0, workflowIndex),
      updatedWorkflow,
      ...workflows.slice(workflowIndex + 1),
    ]);
  };

  const editWorkflowInList = (workflowId: string, workflow: Workflow) => {
    const workflows = workflowList();
    const workflowIndex = findWorkflowIndex(workflowId);

    if (workflowIndex === -1) {
      console.log(`Workflow with id ${workflowId} not found`);
      return;
    }

    const updatedWorkflow = {
      ...workflow,
    };

    setWorkflowList([
      ...workflows.slice(0, workflowIndex),
      updatedWorkflow,
      ...workflows.slice(workflowIndex + 1),
    ]);
  };

  const editWorkflowStepInList = (
    workflowId: string,
    workflowStepId: string,
    workflowStep: WorkflowStep
  ) => {
    const workflows = workflowList();
    const workflowIndex = findWorkflowIndex(workflowId);

    if (workflowIndex === -1) {
      console.log(`Workflow with id ${workflowId} not found`);
      return;
    }

    const workflow = workflows[workflowIndex];
    const workflowStepIndex = workflow.workflowSteps.findIndex(
      (workflowStep) => workflowStep.id === workflowStepId
    );

    if (workflowStepIndex === -1) {
      console.log(`WorkflowStep with id ${workflowStepId} not found`);
      return;
    }

    const updatedWorkflow = {
      ...workflow,
      workflowSteps: [
        ...workflow.workflowSteps.slice(0, workflowStepIndex),
        workflowStep,
        ...workflow.workflowSteps.slice(workflowStepIndex + 1),
      ],
    };

    setWorkflowList([
      ...workflows.slice(0, workflowIndex),
      updatedWorkflow,
      ...workflows.slice(workflowIndex + 1),
    ]);
  };

  const updateWorkflowStepsInList = (
    workflowId: string,
    workflowSteps: WorkflowStep[]
  ) => {
    const workflows = workflowList();
    const workflowIndex = findWorkflowIndex(workflowId);

    if (workflowIndex === -1) {
      console.log(`Workflow with id ${workflowId} not found`);
      return;
    }

    const workflow = workflows[workflowIndex];

    const updatedWorkflow = {
      ...workflow,
      workflowSteps,
    };

    setWorkflowList([
      ...workflows.slice(0, workflowIndex),
      updatedWorkflow,
      ...workflows.slice(workflowIndex + 1),
    ]);
  };

  const addNewWorkflowStep = () => {
    const workflowStep: WorkflowStep = {
      id: uuidv4(),
      temperature: 0,
      holdTimeInSeconds: 0,
      pumpTimeInSeconds: 0,
    };
    const workflows = workflowList();
    const workflowIndex = findWorkflowIndex(selectedWorkflowId());

    if (workflowIndex === -1) {
      console.log(`Workflow with id ${selectedWorkflowId()} not found`);
      return;
    }

    const workflow = workflows[workflowIndex];
    const updatedWorkflow = {
      ...workflow,
      workflowSteps: [...workflow.workflowSteps, workflowStep],
    };

    setWorkflowList([
      ...workflows.slice(0, workflowIndex),
      updatedWorkflow,
      ...workflows.slice(workflowIndex + 1),
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
        selectedWorkflowId,
        setSelectedWorkflowId,
        addWorkflowToList,
        addWorkflowStepToWorkflow,
        deleteWorkflowFromList,
        deleteWorkflowStepFromList,
        editWorkflowInList,
        editWorkflowStepInList,
        workflowList,
        setWorkflowList,
        updateWorkflowStepsInList,
        addNewWorkflowStep,
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
