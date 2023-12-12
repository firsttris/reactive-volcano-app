import { For } from "solid-js";
import { useWorkflow } from "../../provider/WorkflowProvider";
import { Button } from "../Button/Button";


export const WorkflowList = () => {
    const { workflow, addWorkflow, deleteWorkflow, editWorkflow } = useWorkflow();
  return (
    <div>
    <ul>
      <For each={workflow()}>
        {(workflowItem, index) => (
          <li>
            <div>Temperature: {workflowItem.temperature}</div>
            <div>Hold Time: {workflowItem.holdTimeInSeconds}</div>
            <div>Pump Time: {workflowItem.pumpTimeInSeconds}</div>
            <Button onClick={() => editWorkflow(index(), workflowItem)}>Edit</Button>
            <Button onClick={() => deleteWorkflow(index())}>Delete</Button>
          </li>
        )}
      </For>
    </ul>
    <Button onClick={() => addWorkflow()}>Delete</Button>
    </div>

  );
};