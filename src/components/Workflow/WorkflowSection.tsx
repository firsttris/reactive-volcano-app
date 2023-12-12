import { For } from "solid-js";
import { WorkflowItem } from "./WorkflowItem";
import { listOfWorkflows } from "../../utils/workflowData";
import { styled } from "solid-styled-components";

const Container = styled('div')`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 500px) {
    flex-direction: column;
  }
`;

const WorkflowItemContainer = styled('div')`
width: 43%;
@media (max-width: 500px) {
    width: 100%;
  }
`

export const WorkFlowSection = () => {
  return (
    <Container
    >
      <For each={listOfWorkflows}>
        {(workflow) => <WorkflowItemContainer><WorkflowItem name={workflow.name} /></WorkflowItemContainer>}
      </For>
    </Container>
  );
};
