import { For } from "solid-js";
import { WorkflowItem } from "./WorkflowItem";
import { initialListOfWorkflows } from "../../utils/workflowData";
import { styled } from "solid-styled-components";
import { useWorkflow } from "../../provider/WorkflowProvider";

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

  const { workflowList } = useWorkflow();

  return (
    <Container
    >
      <For each={workflowList()}>
        {(workflow, index) => <WorkflowItemContainer><WorkflowItem name={workflow.name} index={index()} /></WorkflowItemContainer>}
      </For>
    </Container>
  );
};
