import { For } from "solid-js";
import { useWorkflow } from "../../provider/WorkflowProvider";
import { Button } from "../Button/Button";
import { useNavigate } from "@solidjs/router";


export const WorkflowList = () => {
    const { workflow, addWorkflow, deleteWorkflowStep, workflowStepIndex, workflowListIndex } = useWorkflow();
    const navigate = useNavigate();
  return (
    <div>
    <ul>
      <For each={workflow()}>
        {(workflowItem, index) => (
          <li>
            <div>Temperature: {workflowItem.temperature}</div>
            <div>Hold Time: {workflowItem.holdTimeInSeconds}</div>
            <div>Pump Time: {workflowItem.pumpTimeInSeconds}</div>
            <Button onClick={() => navigate(`/workflow-step-details/${workflowListIndex()}/${workflowStepIndex()}`)}>Edit</Button>
            <Button onClick={() => deleteWorkflowStep(workflowListIndex(), index())}>Delete</Button>
          </li>
        )}
      </For>
    </ul>
    <Button onClick={() => addWorkflow()}>Delete</Button>
    </div>

  );
};