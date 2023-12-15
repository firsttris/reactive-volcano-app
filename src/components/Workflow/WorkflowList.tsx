import { For } from "solid-js";
import { useWorkflow } from "../../provider/WorkflowProvider";
import { Button } from "../Button/Button";
import { useNavigate, useParams } from "@solidjs/router";
import { AiFillEdit } from "solid-icons/ai";
import { AiFillDelete } from "solid-icons/ai";
import { styled } from "solid-styled-components";

const ResponsiveContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 25px;
  max-width: 600px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    margin: 0px;
    max-width: unset;
  }
`;

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
    <ResponsiveContainer>
      <ol>
        <For each={workflowSteps()}>
          {(workflowItem) => (
            <li style={{ "margin-bottom": "20px"}}>
              <div style={{ display: "flex", gap: "20px" }}>
                <div>
                  <div>Temperature: {workflowItem.temperature}</div>
                  <div>Hold Time: {workflowItem.holdTimeInSeconds}</div>
                  <div>Pump Time: {workflowItem.pumpTimeInSeconds}</div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    "align-items": "center",
                  }}
                >
                  <div>
                    <AiFillEdit
                      size="32px"
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        navigate(`/form/${workflowListId}/${workflowItem.id}`)
                      }
                    />
                  </div>
                  <div>
                    <AiFillDelete
                      size="32px"
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        deleteWorkflowStepFromList(
                          workflowListId,
                          workflowItem.id
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </li>
          )}
        </For>
      </ol>
      <div style={{ display: "flex", "flex-direction": "row", gap: "20px" }}>
        <Button onClick={() => navigate("/")}>Cancel</Button>
        <Button onClick={() => addNewWorkflowStep()}>New</Button>
        <Button
          onClick={() => {
            updateWorkflowStepsInList(workflowListId, workflowSteps());
            navigate("/");
          }}
        >
          Save
        </Button>
      </div>
    </ResponsiveContainer>
  );
};
