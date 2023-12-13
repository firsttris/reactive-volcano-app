import { createSignal } from "solid-js";
import { Workflow, WorkflowStep, initialListOfWorkflows } from "../utils/workflowData";
import { v4 as uuidv4 } from "uuid";

export const useWorkflowList = () => {
  const [workflowList, setWorkflowList] = createSignal<Workflow[]>(
    initialListOfWorkflows
  );

  const deleteWorkflow = (workflowIndex: number) => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList.slice(0, workflowIndex),
      ...prevWorkflowList.slice(workflowIndex + 1),
    ]);
  };

  const addWorkflow = () => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList,
      { name: "New", id: uuidv4(), workflowSteps: [] },
    ]);
  };

  const updateWorkflow = (workflowIndex: number, workFlow: Workflow) => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList.slice(0, workflowIndex),
      workFlow,
      ...prevWorkflowList.slice(workflowIndex + 1),
    ]);
  };

  const updateWorkflowSteps = (workflowIndex: number, workflowSteps: WorkflowStep[]) => {
    setWorkflowList((prevWorkflowList) => [
      ...prevWorkflowList.slice(0, workflowIndex),
      { ...prevWorkflowList[workflowIndex], workflowSteps },
      ...prevWorkflowList.slice(workflowIndex + 1),
    ]);
  }

  return { workflowList, deleteWorkflow, addWorkflow, updateWorkflow, updateWorkflowSteps };
};
