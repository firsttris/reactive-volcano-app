import { FiDownload, FiPlus, FiUpload } from "solid-icons/fi";
import { For } from "solid-js";
import { styled } from "solid-styled-components";
import { m } from "../../../paraglide/messages";
import { useWorkflowContext } from "../../../provider/WorkflowProvider";
import { Button } from "../../Button";
import { Card, CardTitle } from "../../Card";
import { WorkflowItem } from "./WorkflowItem";

const Container = styled("div")`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const BulkOperationsContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
`;

const BulkOperationButton = styled(Button)`
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
  const workflow = useWorkflowContext();
  const {
    workflowList,
    addWorkflowToList,
    exportAllWorkflows,
    importAllWorkflows,
    importWorkflow,
  } = workflow;

  const handleExportAll = () => {
    exportAllWorkflows();
  };

  const handleImportAll = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        if (confirm(m.workflow_confirmImportAll())) {
          try {
            await importAllWorkflows(file);
          } catch (error) {
            console.error(
              `${m.workflow_invalidFile()}: ${(error as Error).message}`
            );
          }
        }
      }
    };
    input.click();
  };

  const handleImportWorkflow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await importWorkflow(file);
        } catch (error) {
          console.error(
            `${m.workflow_invalidFile()}: ${(error as Error).message}`
          );
        }
      }
    };
    input.click();
  };

  return (
    <Card>
      <CardTitle>{m.workflow_title()}</CardTitle>
      <Container>
        <For each={workflowList()}>
          {(workflow) => <WorkflowItem workflow={workflow} />}
        </For>
      </Container>
      <AddWorkflowButton onClick={addWorkflowToList}>
        <FiPlus size={24} />
        <span>{m.workflow_add()}</span>
      </AddWorkflowButton>
      <BulkOperationsContainer>
        <BulkOperationButton
          onClick={handleExportAll}
          title={m.workflow_exportAllDescription()}
        >
          <FiDownload size={24} />
          {m.workflow_exportAll()}
        </BulkOperationButton>
        <BulkOperationButton
          onClick={handleImportAll}
          title={m.workflow_importAllDescription()}
        >
          <FiUpload size={24} />
          {m.workflow_importAll()}
        </BulkOperationButton>
        <BulkOperationButton
          onClick={handleImportWorkflow}
          title={m.workflow_importDescription()}
        >
          <FiUpload size={24} />
          {m.workflow_import()}
        </BulkOperationButton>
      </BulkOperationsContainer>
    </Card>
  );
};
