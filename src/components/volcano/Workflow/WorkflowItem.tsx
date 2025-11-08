import { Component, Show } from "solid-js";
import { FiPlay, FiSquare, FiEdit2, FiTrash2 } from "solid-icons/fi";
import { styled } from "solid-styled-components";
import { useNavigate } from "@solidjs/router";
import { Workflow } from "../../../utils/workflowData";
import { useVolcanoDeviceContext } from "../../../provider/VolcanoDeviceProvider";
import { useWorkflowScheduler } from "../../../hooks/volcano/useWorkflowScheduler";
import { buildRoute } from "../../../routes";
import { useTranslations } from "../../../i18n/utils";

interface WorkflowItemProps {
  workflow: Workflow;
}

const Card = styled("div")<{ isActive?: boolean }>`
  background: ${(props) =>
    props.isActive ? "rgba(255, 102, 0, 0.1)" : "#1a1a1a"};
  border: 2px solid ${(props) => (props.isActive ? "#f60" : "#444")};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #f60;
    background: rgba(255, 102, 0, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 102, 0, 0.2);
  }
`;

const WorkflowHeader = styled("div")`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const WorkflowName = styled("div")`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: CustomFont;
`;

const StepCount = styled("div")`
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 12px;
`;

const ActionButtons = styled("div")`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const IconButton = styled("button")<{
  variant?: "play" | "stop" | "edit" | "delete";
}>`
  background: ${(props) => {
    if (props.variant === "play")
      return "linear-gradient(135deg, #f60 0%, #ff7700 100%)";
    if (props.variant === "stop")
      return "linear-gradient(135deg, #d32f2f 0%, #f44336 100%)";
    return "transparent";
  }};
  border: ${(props) =>
    props.variant === "play" || props.variant === "stop"
      ? "none"
      : "1px solid #555"};
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${(props) =>
    props.variant === "play" || props.variant === "stop" ? "white" : "#ccc"};
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => {
      if (props.variant === "play")
        return "linear-gradient(135deg, #ff7700 0%, #ff8800 100%)";
      if (props.variant === "stop")
        return "linear-gradient(135deg, #f44336 0%, #e57373 100%)";
      return "#333";
    }};
    color: ${(props) =>
      props.variant === "edit" || props.variant === "delete"
        ? "#f60"
        : "white"};
    transform: scale(1.05);
    box-shadow: ${(props) =>
      props.variant === "play" || props.variant === "stop"
        ? "0 2px 8px rgba(255, 102, 0, 0.4)"
        : "0 2px 8px rgba(0, 0, 0, 0.3)"};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ProgressBar = styled("div")`
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 12px;
`;

const ProgressFill = styled("div")<{ progress: number }>`
  width: ${(props) => props.progress}%;
  height: 100%;
  background: linear-gradient(90deg, #f60, #ff7700);
  transition: width 0.3s ease;
`;

export const WorkflowItem: Component<WorkflowItemProps> = (props) => {
  const { workflow } = useVolcanoDeviceContext();
  const { setSelectedWorkflowId, deleteWorkflowFromList } = workflow;
  const navigate = useNavigate();
  const t = useTranslations();

  const workflowSteps = () => props.workflow.workflowSteps;
  const {
    startWorkflow,
    stopWorkflow,
    currentStep,
    isRunning: schedulerIsRunning,
  } = useWorkflowScheduler(() => workflowSteps());

  const progress = () => {
    if (!schedulerIsRunning()) return 0;
    const total = workflowSteps().length;
    if (total === 0) return 0;
    return (currentStep() / total) * 100;
  };

  const handlePlay = async (e: MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkflowId(props.workflow.id);
    await startWorkflow();
  };

  const handleStop = async (e: MouseEvent) => {
    e.stopPropagation();
    await stopWorkflow();
  };

  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkflowId(props.workflow.id);
    navigate(buildRoute.workflowList(props.workflow.id));
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    if (confirm(`${t("deleteWorkflow")} "${props.workflow.name}"?`)) {
      deleteWorkflowFromList(props.workflow.id);
    }
  };

  return (
    <Card isActive={schedulerIsRunning()}>
      <WorkflowHeader>
        <WorkflowName>{props.workflow.name}</WorkflowName>
      </WorkflowHeader>
      <StepCount>
        {workflowSteps().length}{" "}
        {workflowSteps().length === 1 ? t("step") : t("steps")}
        <Show when={schedulerIsRunning()}>
          {" "}
          {t("step")} {currentStep() + 1}/{workflowSteps().length}
        </Show>
      </StepCount>
      <ActionButtons>
        <Show
          when={!schedulerIsRunning()}
          fallback={
            <IconButton variant="stop" onClick={handleStop}>
              <FiSquare size={18} />
            </IconButton>
          }
        >
          <IconButton variant="play" onClick={handlePlay}>
            <FiPlay size={18} />
          </IconButton>
        </Show>
        <IconButton variant="edit" onClick={handleEdit}>
          <FiEdit2 size={18} />
        </IconButton>
        <IconButton variant="delete" onClick={handleDelete}>
          <FiTrash2 size={18} />
        </IconButton>
      </ActionButtons>
      <Show when={schedulerIsRunning()}>
        <ProgressBar>
          <ProgressFill progress={progress()} />
        </ProgressBar>
      </Show>
    </Card>
  );
};
