import { createMemo } from "solid-js";
import {
  Workflow,
  WorkflowStep,
  initialListOfWorkflows,
} from "../../utils/workflowData";
import { v4 as uuidv4 } from "uuid";
import { useIndexedDB } from "../utils/useIndexedDB";
export const useWorkflow = () => {
  const [workflowList, setWorkflowList] = useIndexedDB(
    "workflowList",
    initialListOfWorkflows
  );
  const [selectedWorkflowId, setSelectedWorkflowId] = useIndexedDB(
    "selectedWorkflowId",
    ""
  );

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
      (workflowStep: WorkflowStep) => workflowStep.id === workflowStepId
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

  const renameWorkflow = (workflowId: string, newName: string) => {
    const workflows = workflowList();
    const workflowIndex = findWorkflowIndex(workflowId);

    if (workflowIndex === -1) {
      console.log(`Workflow with id ${workflowId} not found`);
      return;
    }

    const workflow = workflows[workflowIndex];
    const updatedWorkflow = {
      ...workflow,
      name: newName,
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
      (workflowStep: WorkflowStep) => workflowStep.id === workflowStepId
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

  const exportWorkflow = (workflowId: string) => {
    const workflow = workflowList().find((w) => w.id === workflowId);
    if (!workflow) {
      console.error(`Workflow with id ${workflowId} not found`);
      return;
    }

    // Create export data without internal IDs to avoid conflicts on import
    const exportData = {
      name: workflow.name,
      workflowSteps: workflow.workflowSteps.map((step) => ({
        temperature: step.temperature,
        holdTimeInSeconds: step.holdTimeInSeconds,
        pumpTimeInSeconds: step.pumpTimeInSeconds,
      })),
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${workflow.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_workflow.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importWorkflow = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);

          // Validate the import data structure
          if (!importData.name || !Array.isArray(importData.workflowSteps)) {
            throw new Error("Invalid workflow file structure");
          }

          // Validate each step
          for (const step of importData.workflowSteps) {
            if (
              typeof step.temperature !== "number" ||
              typeof step.holdTimeInSeconds !== "number" ||
              typeof step.pumpTimeInSeconds !== "number"
            ) {
              throw new Error("Invalid workflow step data");
            }
          }

          // Create new workflow with fresh IDs
          const newWorkflow: Workflow = {
            id: uuidv4(),
            name: importData.name,
            workflowSteps: importData.workflowSteps.map((step: any) => ({
              id: uuidv4(),
              temperature: step.temperature,
              holdTimeInSeconds: step.holdTimeInSeconds,
              pumpTimeInSeconds: step.pumpTimeInSeconds,
            })),
          };

          setWorkflowList([...workflowList(), newWorkflow]);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const exportAllWorkflows = () => {
    const allWorkflows = workflowList();

    // Create export data without internal IDs
    const exportData = {
      workflows: allWorkflows.map((workflow) => ({
        name: workflow.name,
        workflowSteps: workflow.workflowSteps.map((step) => ({
          temperature: step.temperature,
          holdTimeInSeconds: step.holdTimeInSeconds,
          pumpTimeInSeconds: step.pumpTimeInSeconds,
        })),
      })),
      exportedAt: new Date().toISOString(),
      version: "1.0",
      totalWorkflows: allWorkflows.length,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `all_workflows_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importAllWorkflows = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);

          // Validate the import data structure
          if (!importData.workflows || !Array.isArray(importData.workflows)) {
            throw new Error("Invalid workflows file structure");
          }

          // Validate each workflow
          const newWorkflows: Workflow[] = [];
          for (const workflowData of importData.workflows) {
            if (
              !workflowData.name ||
              !Array.isArray(workflowData.workflowSteps)
            ) {
              throw new Error("Invalid workflow structure in file");
            }

            // Validate each step
            for (const step of workflowData.workflowSteps) {
              if (
                typeof step.temperature !== "number" ||
                typeof step.holdTimeInSeconds !== "number" ||
                typeof step.pumpTimeInSeconds !== "number"
              ) {
                throw new Error("Invalid workflow step data");
              }
            }

            // Create new workflow with fresh IDs
            const newWorkflow: Workflow = {
              id: uuidv4(),
              name: workflowData.name,
              workflowSteps: workflowData.workflowSteps.map((step: any) => ({
                id: uuidv4(),
                temperature: step.temperature,
                holdTimeInSeconds: step.holdTimeInSeconds,
                pumpTimeInSeconds: step.pumpTimeInSeconds,
              })),
            };

            newWorkflows.push(newWorkflow);
          }

          setWorkflowList(newWorkflows);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  return {
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
    renameWorkflow,
    exportWorkflow,
    importWorkflow,
    exportAllWorkflows,
    importAllWorkflows,
  };
};
