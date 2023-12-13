import { For } from "solid-js";
import { useWorkflow } from "../../provider/WorkflowProvider";
import { Button } from "../Button/Button";
import { useNavigate, useParams } from "@solidjs/router";
import { useWorkflowList } from "../../hooks/useWorkflowList";

export const WorkflowList = () => {
  const { deleteWorkflowStep, workflowSteps, addWorkflowStep } = useWorkflow();
  const { updateWorkflowSteps } = useWorkflowList();
  const { workflowListIndex } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <ul>
        <For each={workflowSteps()}>
          {(workflowItem, index) => (
            <li>
              <div>Temperature: {workflowItem.temperature}</div>
              <div>Hold Time: {workflowItem.holdTimeInSeconds}</div>
              <div>Pump Time: {workflowItem.pumpTimeInSeconds}</div>
              <div style={{ display: 'flex', "flex-direction": "row", gap: '5px'}}>
              <Button
                onClick={() =>
                  navigate(`/workflow-form/${workflowListIndex}/${index()}`)
                }
              >
                Edit
              </Button>
              <Button onClick={() => deleteWorkflowStep(index())}>
                Delete
              </Button>
              </div>
            </li>
          )}
        </For>
      </ul>
      <div style={{ display: 'flex', "flex-direction": "row"}}>
        <Button onClick={() => addWorkflowStep()}>Add</Button>
        <Button
          onClick={() => {
            updateWorkflowSteps(Number(workflowListIndex), workflowSteps());
            navigate("/");
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
