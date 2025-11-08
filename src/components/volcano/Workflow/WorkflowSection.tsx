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
  background: #2a2a2a;
  border-radius: 16px;
  border: 1px solid #444;
`;

const WorkflowTitle = styled("h2")`
  color: #f60;
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
  background: linear-gradient(135deg, #333 0%, #444 100%);
  border: 2px dashed #555;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1rem;
  color: #ccc;

  &:hover {
    border-color: #f60;
    background: linear-gradient(135deg, #444 0%, #555 100%);
    color: #f60;
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
