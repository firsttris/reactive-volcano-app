import Download from "lucide-solid/icons/download";
import FileUp from "lucide-solid/icons/file-up";
import Plus from "lucide-solid/icons/plus";
import Upload from "lucide-solid/icons/upload";
import { createSignal, For, onMount, Show } from "solid-js";
import { m } from "../../../paraglide/messages";
import { useToast } from "../../../provider/ToastProvider";
import { useWorkflowContext } from "../../../provider/WorkflowProvider";
import {
  clearPendingWorkflow,
  decodeWorkflow,
  getPendingWorkflowCode,
  type SharedWorkflow,
} from "../../../utils/workflowShare";
import { PageTitle } from "../../DeviceShell";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { WorkflowItem } from "./WorkflowItem";

const MenuItemText = (props: { title: string; description: string }) => (
  <span class="flex flex-col gap-0.5">
    <span>{props.title}</span>
    <span class="text-muted-foreground text-xs">{props.description}</span>
  </span>
);

/** Lets the user pick a JSON file */
const pickJsonFile = (onPick: (file: File) => void) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) onPick(file);
  };
  input.click();
};

export const WorkFlowSection = () => {
  const workflow = useWorkflowContext();
  const {
    workflowList,
    addWorkflowToList,
    exportAllWorkflows,
    importAllWorkflows,
    importWorkflow,
    addSharedWorkflow,
  } = workflow;
  const showToast = useToast();

  // Replacing every workflow needs a confirmation first
  const [pendingImportAll, setPendingImportAll] = createSignal<File>();

  // A workflow from a share link waits for confirmation here
  const [sharedWorkflow, setSharedWorkflow] = createSignal<SharedWorkflow>();
  onMount(() => {
    const code = getPendingWorkflowCode();
    if (!code) return;
    const shared = decodeWorkflow(code);
    if (shared) {
      setSharedWorkflow(shared);
    } else {
      clearPendingWorkflow();
      showToast({ message: m.workflow_invalidLink() });
    }
  });

  const dismissShared = () => {
    clearPendingWorkflow();
    setSharedWorkflow(undefined);
  };

  const importShared = () => {
    const shared = sharedWorkflow();
    dismissShared();
    if (!shared) return;
    addSharedWorkflow(shared);
    showToast({ message: m.workflow_imported({ name: shared.name }) });
  };

  const reportInvalidFile = (error: unknown) => {
    console.error(`${m.workflow_invalidFile()}: ${(error as Error).message}`);
    showToast({ message: m.workflow_invalidFile() });
  };

  const confirmImportAll = async () => {
    const file = pendingImportAll();
    setPendingImportAll(undefined);
    if (!file) return;
    try {
      await importAllWorkflows(file);
    } catch (error) {
      reportInvalidFile(error);
    }
  };

  const handleImportWorkflow = () =>
    pickJsonFile(async (file) => {
      try {
        await importWorkflow(file);
      } catch (error) {
        reportInvalidFile(error);
      }
    });

  return (
    <>
      <PageTitle
        actions={
          <div class="flex gap-2">
            <DropdownMenu placement="bottom-end">
              <DropdownMenuTrigger
                as={Button}
                variant="outline"
                size="icon"
                class="text-muted-foreground"
                aria-label={m.workflow_importExport()}
              >
                <Download />
              </DropdownMenuTrigger>
              <DropdownMenuContent class="max-w-72">
                <DropdownMenuItem onSelect={exportAllWorkflows}>
                  <Download />
                  <MenuItemText
                    title={m.workflow_exportAll()}
                    description={m.workflow_exportAllDescription()}
                  />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleImportWorkflow}>
                  <FileUp />
                  <MenuItemText
                    title={m.workflow_import()}
                    description={m.workflow_importDescription()}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => pickJsonFile(setPendingImportAll)}
                >
                  <Upload />
                  <MenuItemText
                    title={m.workflow_importAll()}
                    description={m.workflow_importAllDescription()}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={addWorkflowToList}>
              <Plus />
              {m.workflow_new()}
            </Button>
          </div>
        }
      >
        {m.workflow_title()}
      </PageTitle>

      <Show
        when={workflowList().length > 0}
        fallback={
          <div class="flex flex-col items-center gap-4 rounded-card border border-dashed px-6 py-12 text-center text-muted-foreground text-sm">
            {m.workflow_empty()}
            <Button variant="secondary" onClick={addWorkflowToList}>
              <Plus />
              {m.workflow_add()}
            </Button>
          </div>
        }
      >
        <div class="grid gap-3">
          <For each={workflowList()}>
            {(workflow) => <WorkflowItem workflow={workflow} />}
          </For>
        </div>
      </Show>

      <AlertDialog
        open={!!sharedWorkflow()}
        onOpenChange={(open) => !open && dismissShared()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.workflow_importShared()}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.workflow_importSharedDescription({
                name: sharedWorkflow()?.name ?? "",
                steps: m.workflow_stepCount({
                  count: sharedWorkflow()?.workflowSteps.length ?? 0,
                }),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose variant="outline">
              {m.common_cancel()}
            </AlertDialogClose>
            <Button onClick={importShared}>
              <Download />
              {m.workflow_importAction()}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingImportAll()}
        onOpenChange={(open) => !open && setPendingImportAll(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.workflow_importAll()}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.workflow_confirmImportAll()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose variant="outline">
              {m.common_cancel()}
            </AlertDialogClose>
            <Button onClick={confirmImportAll}>
              <Upload />
              {m.workflow_importAll()}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
