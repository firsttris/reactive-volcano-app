import { useNavigate, useParams } from "@solidjs/router";
import Pencil from "lucide-solid/icons/pencil";
import Plus from "lucide-solid/icons/plus";
import Save from "lucide-solid/icons/save";
import Trash2 from "lucide-solid/icons/trash";
import { For, type JSX, Show } from "solid-js";
import { m } from "../../../paraglide/messages";
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
  const workflow = useWorkflowContext();
  const {
    deleteWorkflowStepFromList,
    workflowSteps,
    workflowList,
    updateWorkflowStepsInList,
    addNewWorkflowStep,
  } = workflow;
  const { workflowListId } = useParams();
  const navigate = useNavigate();

  const workflowName = () =>
    workflowList().find((item) => item.id === workflowListId)?.name;
  const backToWorkflows = () => navigate(buildRoute.volcanoWorkflows());

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
                      onClick={() =>
                        workflowListId &&
                        navigate(
                          buildRoute.workflowForm(
                            workflowListId,
                            workflowItem.id
                          )
                        )
                      }
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="hover:text-destructive"
                      aria-label={m.workflow_delete()}
                      onClick={() =>
                        workflowListId &&
                        deleteWorkflowStepFromList(
                          workflowListId,
                          workflowItem.id
                        )
                      }
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

      <div class="grid grid-cols-3 gap-2 pt-1">
        <Button variant="outline" onClick={backToWorkflows}>
          {m.common_cancel()}
        </Button>
        <Button variant="secondary" onClick={() => addNewWorkflowStep()}>
          <Plus />
          {m.common_add()}
        </Button>
        <Button
          onClick={() => {
            if (workflowListId) {
              updateWorkflowStepsInList(workflowListId, workflowSteps());
            }
            backToWorkflows();
          }}
        >
          <Save />
          {m.common_save()}
        </Button>
      </div>
    </>
  );
};
