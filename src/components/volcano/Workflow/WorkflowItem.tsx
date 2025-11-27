import { Component, Show, createSignal } from "solid-js";
import {
  FiPlay,
  FiSquare,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiDownload,
} from "solid-icons/fi";
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
  background: var(--bg-color);
  border: 2px solid
    ${(props) =>
      props.isActive ? "var(--accent-color)" : "var(--border-color)"};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: var(--accent-color);
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

const NameContainer = styled("div")`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const NameInput = styled("input")`
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
  font-family: CustomFont;
  flex: 1;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const SmallIconButton = styled("button")`
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: var(--accent-color);
    background: var(--secondary-bg);
  }
`;

const WorkflowName = styled("div")`
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
  font-family: CustomFont;
`;

const StepCount = styled("div")`
  color: var(--tertiary-text);
  font-size: 0.9rem;
  margin-bottom: 12px;
`;

const ActionButtons = styled("div")`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const IconButton = styled("button")<{
  variant?: "play" | "stop" | "edit" | "delete" | "export";
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
      : "1px solid var(--border-color)"};
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${(props) =>
    props.variant === "play" || props.variant === "stop"
      ? "white"
      : "var(--secondary-text)"};
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => {
      if (props.variant === "play")
        return "linear-gradient(135deg, #ff7700 0%, #ff8800 100%)";
      if (props.variant === "stop")
        return "linear-gradient(135deg, #f44336 0%, #e57373 100%)";
      return "var(--secondary-bg)";
    }};
    color: ${(props) =>
      props.variant === "edit" || props.variant === "delete"
        ? "var(--accent-color)"
        : "white"};
    transform: scale(1.05);
    box-shadow: ${(props) =>
      props.variant === "play" || props.variant === "stop"
        ? "0 2px 8px rgba(255, 102, 0, 0.4)"
        : "0 2px 8px rgba(0, 0, 0, 0.1)"};
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
  const {
    setSelectedWorkflowId,
    deleteWorkflowFromList,
    renameWorkflow,
    exportWorkflow,
  } = workflow;
  const navigate = useNavigate();
  const t = useTranslations();

  const [isEditingName, setIsEditingName] = createSignal(false);
  const [editedName, setEditedName] = createSignal(props.workflow.name);

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

  const handleExport = (e: MouseEvent) => {
    e.stopPropagation();
    exportWorkflow(props.workflow.id);
  };

  const handleStartEditName = (e: Event) => {
    e.stopPropagation();
    setEditedName(props.workflow.name);
    setIsEditingName(true);
  };

  const handleSaveName = (e: Event) => {
    e.stopPropagation();
    const newName = editedName().trim();
    if (newName && newName !== props.workflow.name) {
      renameWorkflow(props.workflow.id, newName);
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = (e: Event) => {
    e.stopPropagation();
    setIsEditingName(false);
    setEditedName(props.workflow.name);
  };

  return (
    <Card isActive={schedulerIsRunning()}>
      <WorkflowHeader>
        <NameContainer>
          <Show
            when={isEditingName()}
            fallback={
              <>
                <WorkflowName>{props.workflow.name}</WorkflowName>
                <SmallIconButton onClick={handleStartEditName}>
                  <FiEdit2 size={14} />
                </SmallIconButton>
              </>
            }
          >
            <NameInput
              value={editedName()}
              onInput={(e) => setEditedName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName(e);
                if (e.key === "Escape") handleCancelEditName(e);
              }}
            />
            <SmallIconButton onClick={handleSaveName}>
              <FiCheck size={14} />
            </SmallIconButton>
            <SmallIconButton onClick={handleCancelEditName}>
              <FiX size={14} />
            </SmallIconButton>
          </Show>
        </NameContainer>
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
        <IconButton
          variant="export"
          onClick={handleExport}
          title={t("exportWorkflowDescription")}
        >
          <FiDownload size={18} />
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
