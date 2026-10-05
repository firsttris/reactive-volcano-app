import { useNavigate, useParams } from "@solidjs/router";
import Check from "lucide-solid/icons/check";
import Pencil from "lucide-solid/icons/pencil";
import Plus from "lucide-solid/icons/plus";
import Trash2 from "lucide-solid/icons/trash";
import { For, type JSX, Show } from "solid-js";
import { m } from "../../../paraglide/messages";
import { useToast } from "../../../provider/ToastProvider";
import { useWorkflowContext } from "../../../provider/WorkflowProvider";
import { buildRoute } from "../../../routes";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { EditorHeader } from "./EditorHeader";

const StepValue = (props: { label: string; children: JSX.Element }) => (
  <div class="flex min-w-0 flex-col gap-0.5">
    <span class="truncate text-[11px] text-muted-foreground">
      {props.label}
    </span>
    <span class="font-semibold text-sm tabular-nums">{props.children}</span>
  </div>
);

export const WorkflowList = () => {
  const {
    stepsOf,
    workflowList,
    updateWorkflowStepsInList,
    addNewWorkflowStep,
  } = useWorkflowContext();
  // Not destructured, so the page follows a change of the route
  const params = useParams();
  const workflowId = () => params.workflowListId ?? "";
  const navigate = useNavigate();
  const showToast = useToast();

  // Always the workflow in the URL, never just the selected one
  const workflowSteps = () => stepsOf(workflowId());
  const workflowName = () =>
    workflowList().find((item) => item.id === workflowId())?.name;
  const backToWorkflows = () => navigate(buildRoute.volcanoWorkflows());

  const editStep = (stepId: string) =>
    navigate(buildRoute.workflowForm(workflowId(), stepId));

  const addStep = () => {
    const stepId = addNewWorkflowStep(workflowId());
    if (stepId) editStep(stepId);
  };

  // Changes are saved right away; a deleted step can be put back
  const deleteStep = (stepId: string, number: number) => {
    const id = workflowId();
    const before = workflowSteps();
    updateWorkflowStepsInList(
      id,
      before.filter((step) => step.id !== stepId)
    );
    showToast({
      message: m.workflow_stepDeleted({ number }),
      actionLabel: m.common_undo(),
      onAction: () => updateWorkflowStepsInList(id, before),
    });
  };

  return (
    <>
      <EditorHeader
        title={m.workflow_editSteps()}
        subtitle={workflowName()}
        onBack={backToWorkflows}
      />

      <Show
        when={workflowSteps().length > 0}
        fallback={
          <div class="rounded-card border border-dashed px-6 py-12 text-center text-muted-foreground text-sm">
            {m.workflow_noSteps()}
          </div>
        }
      >
        <ol class="grid gap-2.5">
          <For each={workflowSteps()}>
            {(workflowItem, index) => (
              <li>
                <Card class="flex items-center gap-3 p-3.5">
                  <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary text-sm tabular-nums">
                    {index() + 1}
                  </span>
                  <div class="grid flex-1 grid-cols-3 gap-2">
                    <StepValue label={m.workflow_temperature()}>
                      {workflowItem.temperature} °C
                    </StepValue>
                    <StepValue label={m.workflow_holdTime()}>
                      {workflowItem.holdTimeInSeconds} s
                    </StepValue>
                    <StepValue label={m.workflow_pumpTime()}>
                      {workflowItem.pumpTimeInSeconds} s
                    </StepValue>
                  </div>
                  <div class="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={m.workflow_editStep()}
                      onClick={() => editStep(workflowItem.id)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="hover:text-destructive"
                      aria-label={m.workflow_deleteStep()}
                      onClick={() => deleteStep(workflowItem.id, index() + 1)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </Card>
              </li>
            )}
          </For>
        </ol>
      </Show>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <Button variant="secondary" onClick={addStep}>
          <Plus />
          {m.workflow_addStep()}
        </Button>
        <Button onClick={backToWorkflows}>
          <Check />
          {m.common_done()}
        </Button>
      </div>
    </>
  );
};
