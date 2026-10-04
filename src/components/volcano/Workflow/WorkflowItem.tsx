import { useNavigate } from "@solidjs/router";
import Check from "lucide-solid/icons/check";
import Download from "lucide-solid/icons/download";
import Ellipsis from "lucide-solid/icons/ellipsis";
import ListOrdered from "lucide-solid/icons/list-ordered";
import Pencil from "lucide-solid/icons/pencil";
import Play from "lucide-solid/icons/play";
import Share2 from "lucide-solid/icons/share-2";
import Square from "lucide-solid/icons/square";
import Trash2 from "lucide-solid/icons/trash";
import X from "lucide-solid/icons/x";
import { type Component, createSignal, For, Index, Show } from "solid-js";
import { cn } from "../../../lib/utils";
import { m } from "../../../paraglide/messages";
import { useToast } from "../../../provider/ToastProvider";
import { useWorkflowContext } from "../../../provider/WorkflowProvider";
import { useWorkflowRunner } from "../../../provider/WorkflowRunnerProvider";
import { buildRoute } from "../../../routes";
import type { Workflow } from "../../../utils/workflowData";
import { buildShareUrl } from "../../../utils/workflowShare";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { TextField, TextFieldInput } from "../../ui/text-field";

interface WorkflowItemProps {
  workflow: Workflow;
}

/** How many step temperatures fit on the card before "+n" */
const VISIBLE_STEPS = 5;

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
  const hiddenSteps = () => workflowSteps().length - VISIBLE_STEPS;

  const handlePlay = async () => {
    setSelectedWorkflowId(props.workflow.id);
    await runner.start(props.workflow.id);
  };

  const handleEdit = () => {
    setSelectedWorkflowId(props.workflow.id);
    navigate(buildRoute.workflowList(props.workflow.id));
  };

  const handleDelete = async () => {
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

  const handleShare = async () => {
    const appUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
    const url = buildShareUrl(props.workflow, appUrl.toString());
    if (navigator.share) {
      try {
        await navigator.share({ title: props.workflow.name, url });
        return;
      } catch (error) {
        // Closing the share sheet is not an error
        if ((error as DOMException).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: m.workflow_linkCopied() });
    } catch (error) {
      console.error("Copying the share link failed:", error);
    }
  };

  const handleStartEditName = () => {
    setEditedName(props.workflow.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const newName = editedName().trim();
    if (newName && newName !== props.workflow.name) {
      renameWorkflow(props.workflow.id, newName);
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName(props.workflow.name);
  };

  return (
    <Card
      class={cn(
        "flex flex-col gap-3 p-4 transition-colors",
        schedulerIsRunning() && "border-primary/50 bg-primary-soft"
      )}
    >
      <div class="flex items-center gap-2">
        <Show
          when={isEditingName()}
          fallback={
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <div class="truncate font-semibold text-[15px]">
                {props.workflow.name}
              </div>
              <div class="text-muted-foreground text-xs">
                {m.workflow_stepCount({ count: workflowSteps().length })}
                <Show when={schedulerIsRunning()}>
                  {" · "}
                  <span class="font-medium text-primary">
                    {m.workflow_stepOf({
                      current: currentStep() + 1,
                      total: workflowSteps().length,
                    })}
                  </span>
                </Show>
              </div>
            </div>
          }
        >
          <TextField
            class="flex-1"
            value={editedName()}
            onChange={setEditedName}
          >
            <TextFieldInput
              aria-label={m.workflow_rename()}
              ref={(el: HTMLInputElement) => queueMicrotask(() => el.focus())}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") handleCancelEditName();
              }}
            />
          </TextField>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={m.common_save()}
            onClick={handleSaveName}
          >
            <Check />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={m.common_cancel()}
            onClick={handleCancelEditName}
          >
            <X />
          </Button>
        </Show>

        <Show when={!isEditingName()}>
          <DropdownMenu placement="bottom-end">
            <DropdownMenuTrigger
              as={Button}
              variant="ghost"
              size="icon-sm"
              aria-label={m.workflow_moreActions()}
            >
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={handleEdit}>
                <ListOrdered />
                {m.workflow_editSteps()}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleStartEditName}>
                <Pencil />
                {m.workflow_rename()}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleShare}>
                <Share2 />
                {m.workflow_share()}
              </DropdownMenuItem>
              <DropdownMenuItem
                title={m.workflow_exportDescription()}
                onSelect={() => exportWorkflow(props.workflow.id)}
              >
                <Download />
                {m.workflow_export()}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-destructive data-[highlighted]:text-destructive [&_svg]:text-destructive"
                onSelect={handleDelete}
              >
                <Trash2 />
                {m.workflow_delete()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Show
            when={!schedulerIsRunning()}
            fallback={
              <Button
                variant="destructive"
                size="icon"
                class="rounded-full"
                aria-label={m.common_stop()}
                onClick={() => runner.stop()}
              >
                <Square class="fill-current" />
              </Button>
            }
          >
            <Button
              size="icon"
              class="rounded-full bg-foreground text-background shadow-none hover:bg-foreground/85"
              aria-label={m.common_start()}
              onClick={handlePlay}
            >
              <Play class="translate-x-px fill-current" />
            </Button>
          </Show>
        </Show>
      </div>

      <Show
        when={schedulerIsRunning()}
        fallback={
          <div class="flex flex-wrap gap-1.5">
            <For each={workflowSteps().slice(0, VISIBLE_STEPS)}>
              {(step) => (
                <span class="inline-flex h-6 items-center rounded-full border bg-muted px-2 font-mono text-[11px] text-muted-foreground tabular-nums">
                  {step.temperature}°
                </span>
              )}
            </For>
            <Show when={hiddenSteps() > 0}>
              <span class="inline-flex h-6 items-center rounded-full px-1.5 font-mono text-[11px] text-muted-foreground">
                +{hiddenSteps()}
              </span>
            </Show>
          </div>
        }
      >
        <div
          class="grid gap-1"
          style={{
            "grid-template-columns": `repeat(${workflowSteps().length}, minmax(0, 1fr))`,
          }}
        >
          <Index each={workflowSteps()}>
            {(_, index) => (
              <span
                class={cn(
                  "h-1 rounded-full bg-primary/25 transition-colors",
                  index < currentStep() && "bg-primary",
                  index === currentStep() &&
                    "bg-primary/70 motion-safe:animate-pulse"
                )}
              />
            )}
          </Index>
        </div>
      </Show>
    </Card>
  );
};
