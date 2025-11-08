import { For } from "solid-js";
import { WorkflowItem } from "./WorkflowItem";
import { styled } from "solid-styled-components";
import { useVolcanoDeviceContext } from "../../../provider/VolcanoDeviceProvider";
import { Button } from "../../Button";
import { FiPlus } from "solid-icons/fi";
import { useTranslations } from "../../../i18n/utils";

const WorkflowContainer = styled("div")`
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: var(--secondary-bg);
  border-radius: 16px;
  border: 1px solid var(--border-color);
`;

const WorkflowTitle = styled("h2")`
  color: var(--accent-color);
  font-size: 1.5rem;
  margin-bottom: 24px;
  text-align: center;
  font-family: CustomFont;
`;

const Container = styled("div")`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const AddWorkflowButton = styled(Button)`
  width: 100%;
  height: 50px;
  background: var(--secondary-bg);
  border: 2px dashed var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1rem;
  color: var(--text-color);

  &:hover {
    border-color: var(--accent-color);
    background: var(--bg-color);
    color: var(--accent-color);
  }
`;

export const WorkFlowSection = () => {
  const { workflow } = useVolcanoDeviceContext();
  const t = useTranslations();
  const { workflowList, addWorkflowToList } = workflow;

  return (
    <WorkflowContainer>
      <WorkflowTitle>{t("workflows")}</WorkflowTitle>
      <Container>
        <For each={workflowList()}>
          {(workflow) => <WorkflowItem workflow={workflow} />}
        </For>
      </Container>
      <AddWorkflowButton onClick={addWorkflowToList}>
        <FiPlus size={24} />
        <span>{t("addWorkflow")}</span>
      </AddWorkflowButton>
    </WorkflowContainer>
  );
};
