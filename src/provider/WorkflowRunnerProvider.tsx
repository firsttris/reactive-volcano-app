import {
  createContext,
  createMemo,
  createSignal,
  type JSX,
  useContext,
} from "solid-js";
import { useWakeLock } from "../hooks/utils/useWakeLock";
import { useWorkflowScheduler } from "../hooks/volcano/useWorkflowScheduler";
import { useWorkflowContext } from "./WorkflowProvider";

const createWorkflowRunner = () => {
  const { workflowList } = useWorkflowContext();
  const [runningWorkflowId, setRunningWorkflowId] = createSignal<string>();

  const runningWorkflow = createMemo(() =>
    workflowList().find((workflow) => workflow.id === runningWorkflowId())
  );

  const scheduler = useWorkflowScheduler(
    () => runningWorkflow()?.workflowSteps ?? []
  );

  // Keep the screen on while a workflow runs (LiveSessionProvider covers
  // heating)
  useWakeLock(scheduler.isRunning);

  const start = async (workflowId: string) => {
    setRunningWorkflowId(workflowId);
    await scheduler.startWorkflow();
  };

  const stop = async () => {
    await scheduler.stopWorkflow();
    setRunningWorkflowId(undefined);
  };

  const isRunningWorkflow = (workflowId: string) =>
    scheduler.isRunning() && runningWorkflowId() === workflowId;

  return {
    start,
    stop,
    runningWorkflow,
    isRunningWorkflow,
    isRunning: scheduler.isRunning,
    currentStep: scheduler.currentStep,
    phase: scheduler.phase,
  };
};

type WorkflowRunner = ReturnType<typeof createWorkflowRunner>;

const WorkflowRunnerContext = createContext<WorkflowRunner>();

/**
 * Runs one workflow at a time. Lives above the routes so a running workflow
 * keeps going while its steps are being edited.
 */
export const WorkflowRunnerProvider = (props: { children: JSX.Element }) => (
  <WorkflowRunnerContext.Provider value={createWorkflowRunner()}>
    {props.children}
  </WorkflowRunnerContext.Provider>
);

export const useWorkflowRunner = () => {
  const context = useContext(WorkflowRunnerContext);
  if (!context) {
    throw new Error(
      "useWorkflowRunner must be used within a WorkflowRunnerProvider"
    );
  }
  return context;
};
