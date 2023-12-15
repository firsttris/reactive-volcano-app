import { Component } from "solid-js";
import { OcWorkflow3 } from "solid-icons/oc";
import { AiFillPlaySquare } from "solid-icons/ai";
import { styled } from "solid-styled-components";
import { useNavigate } from "@solidjs/router";
import { Workflow } from "../../utils/workflowData";
import { useWorkflow } from "../../provider/WorkflowProvider";

interface WorkflowItemProps {
  workflow: Workflow
}

const Container = styled('div')`
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: start;
  font-size: 30px;
  margin-top: 20px;
`;

const WorkflowName = styled('div')`
  min-width: 200px;
  cursor: pointer;
`;

export const WorkflowItem: Component<WorkflowItemProps> = (props) => {
  const { setSelectedWorkflowId } = useWorkflow();
  const navigate = useNavigate();

    const selectWorkflow = () => {
      setSelectedWorkflowId(props.workflow.id);
      navigate(`/list/${props.workflow.id}`)
    }

    return (
      <Container onClick={selectWorkflow}>
        <WorkflowName>
          <OcWorkflow3 /> <span>{props.workflow.name}</span>
        </WorkflowName>
        <AiFillPlaySquare />
      </Container>
    );
  };
