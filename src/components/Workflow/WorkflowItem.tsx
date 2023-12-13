import { Component } from "solid-js";
import { OcWorkflow3 } from "solid-icons/oc";
import { AiFillPlaySquare } from "solid-icons/ai";
import { styled } from "solid-styled-components";
import { A } from "@solidjs/router";

interface WorkflowItemProps {
  name: string;
  index: number;
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
`;

export const WorkflowItem: Component<WorkflowItemProps> = (props) => {
    return (
      <Container>
        <A href={`/workflow-details/${props.index}`}>
        <WorkflowName>
          <OcWorkflow3 /> <span>{props.name}</span>
        </WorkflowName>
        <AiFillPlaySquare />
        </A>
      </Container>
    );
  };
