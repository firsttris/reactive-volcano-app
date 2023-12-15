import { For } from "solid-js";
import { useWorkflow } from "../../provider/WorkflowProvider";
import { Button } from "../Button/Button";
import { useNavigate, useParams } from "@solidjs/router";

export const WorkflowList = () => {
  const {
    deleteWorkflowStepFromList,
    workflowSteps,
    updateWorkflowStepsInList,
    addNewWorkflowStep,
  } = useWorkflow();

  const { workflowListId } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <ul>
        <For each={workflowSteps()}>
          {(workflowItem) => (
            <li>
              <div>Temperature: {workflowItem.temperature}</div>
              <div>Hold Time: {workflowItem.holdTimeInSeconds}</div>
              <div>Pump Time: {workflowItem.pumpTimeInSeconds}</div>
              <div
                style={{ display: "flex", "flex-direction": "row", gap: "5px" }}
              >
                <Button
                  onClick={() =>
                    navigate(`/form/${workflowListId}/${workflowItem.id}`)
                  }
                >
                  Edit
                </Button>
                <Button
                  onClick={() =>
                    deleteWorkflowStepFromList(workflowListId, workflowItem.id)
                  }
                >
                  Delete
                </Button>
              </div>
            </li>
          )}
        </For>
      </ul>
      <div style={{ display: "flex", "flex-direction": "row" }}>
        <Button onClick={() => addNewWorkflowStep()}>Add</Button>
        <Button
          onClick={() => {
            updateWorkflowStepsInList(workflowListId, workflowSteps());
            navigate("/");
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
