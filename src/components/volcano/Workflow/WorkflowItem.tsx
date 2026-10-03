import { useNavigate } from "@solidjs/router";
import {
  FiCheck,
  FiDownload,
  FiEdit2,
  FiPlay,
  FiSquare,
  FiTrash2,
  FiX,
} from "solid-icons/fi";
import { type Component, createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { m } from "../../../paraglide/messages";
import { useToast } from "../../../provider/ToastProvider";
import { useWorkflowContext } from "../../../provider/WorkflowProvider";
import { useWorkflowRunner } from "../../../provider/WorkflowRunnerProvider";
import { buildRoute } from "../../../routes";
import type { Workflow } from "../../../utils/workflowData";

interface WorkflowItemProps {
  workflow: Workflow;
}

const Card = styled("div")<{ isActive?: boolean }>`
  background: ${(props) =>
    props.isActive ? "rgba(255, 102, 0, 0.1)" : "var(--bg-color)"};
  border: 2px solid
    ${(props) =>
      props.isActive ? "var(--accent-color)" : "var(--border-color)"};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  @media (hover: hover) {
    &:hover {
      border-color: var(--accent-color);
      background: rgba(255, 102, 0, 0.05);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 102, 0, 0.2);
    }
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

  @media (hover: hover) {
    &:hover {
      color: var(--accent-color);
      background: var(--secondary-bg);
    }
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
      return "linear-gradient(135deg, var(--accent-color) 0%, #ff7700 100%)";
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

  @media (hover: hover) {
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
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ProgressBar = styled("div")`
  width: 100%;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 12px;
`;

const ProgressFill = styled("div")<{ progress: number }>`
  width: ${(props) => props.progress}%;
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), #ff7700);
  transition: width 0.3s ease;
`;

export const WorkflowItem: Component<WorkflowItemProps> = (props) => {
  const workflow = useWorkflowContext();
  const {
    setSelectedWorkflowId,
    deleteWorkflowFromList,
    renameWorkflow,
    exportWorkflow,
  } = workflow;
  const navigate = useNavigate();

  const [isEditingName, setIsEditingName] = createSignal(false);
  const [editedName, setEditedName] = createSignal(props.workflow.name);

  const runner = useWorkflowRunner();
  const showToast = useToast();

  const workflowSteps = () => props.workflow.workflowSteps;
  const schedulerIsRunning = () => runner.isRunningWorkflow(props.workflow.id);
  const currentStep = runner.currentStep;

  const progress = () => {
    if (!schedulerIsRunning()) return 0;
    const total = workflowSteps().length;
    if (total === 0) return 0;
    return (currentStep() / total) * 100;
  };

  const handlePlay = async (e: MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkflowId(props.workflow.id);
    await runner.start(props.workflow.id);
  };

  const handleStop = async (e: MouseEvent) => {
    e.stopPropagation();
    await runner.stop();
  };

  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkflowId(props.workflow.id);
    navigate(buildRoute.workflowList(props.workflow.id));
  };

  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation();
    const name = props.workflow.name;
    if (schedulerIsRunning()) await runner.stop();
    const undo = deleteWorkflowFromList(props.workflow.id);
    if (!undo) return;
    showToast({
      message: `„${name}“ ${m.workflow_deleted()}`,
      actionLabel: m.common_undo(),
      onAction: undo,
    });
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
        {m.workflow_stepCount({ count: workflowSteps().length })}
        <Show when={schedulerIsRunning()}>
          {" · "}
          {m.workflow_stepOf({
            current: currentStep() + 1,
            total: workflowSteps().length,
          })}
        </Show>
      </StepCount>
      <ActionButtons>
        <Show
          when={!schedulerIsRunning()}
          fallback={
            <IconButton
              variant="stop"
              onClick={handleStop}
              aria-label={m.common_stop()}
            >
              <FiSquare size={18} />
            </IconButton>
          }
        >
          <IconButton
            variant="play"
            onClick={handlePlay}
            aria-label={m.common_start()}
          >
            <FiPlay size={18} />
          </IconButton>
        </Show>
        <IconButton
          variant="edit"
          onClick={handleEdit}
          aria-label={m.workflow_editSteps()}
        >
          <FiEdit2 size={18} />
        </IconButton>
        <IconButton
          variant="export"
          onClick={handleExport}
          title={m.workflow_exportDescription()}
          aria-label={m.workflow_export()}
        >
          <FiDownload size={18} />
        </IconButton>
        <IconButton
          variant="delete"
          onClick={handleDelete}
          aria-label={m.workflow_delete()}
        >
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
