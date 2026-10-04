import Square from "lucide-solid/icons/square";
import Wind from "lucide-solid/icons/wind";
import { createSignal, Index, onCleanup, Show } from "solid-js";
import { cn } from "../../../lib/utils";
import { m } from "../../../paraglide/messages";
import { useVolcano } from "../../../provider/VolcanoProvider";
import { useWorkflowRunner } from "../../../provider/WorkflowRunnerProvider";
import { convertCelsiusToFahrenheit } from "../../../utils/bluetoothUtils";
import { formatDuration } from "../../../utils/heatProgress";
import { Button } from "../../ui/button";

/** Floating status of the running workflow, above the tab bar */
export const RunningWorkflowBar = () => {
  const runner = useWorkflowRunner();
  const { derived } = useVolcano();
  const [now, setNow] = createSignal(Date.now());
  const timer = setInterval(() => setNow(Date.now()), 500);
  onCleanup(() => clearInterval(timer));

  const steps = () => runner.runningWorkflow()?.workflowSteps ?? [];

  const formatTemp = (celsius: number) =>
    derived.isCelsius()
      ? `${celsius}°C`
      : `${convertCelsiusToFahrenheit(celsius)}°F`;

  const phaseText = () => {
    const phase = runner.phase();
    if (!phase) return "";
    if (phase.type === "heating") {
      return `${m.workflow_heatingTo()} ${formatTemp(phase.targetTemp)}`;
    }
    const seconds = Math.max(0, Math.ceil((phase.endsAt - now()) / 1000));
    const label =
      phase.type === "holding" ? m.workflow_holding() : m.workflow_pumping();
    return `${label} ${formatDuration(seconds)}`;
  };

  return (
    <Show when={runner.isRunning()}>
      {/* Keeps the end of the page reachable behind the floating bar */}
      <div class="h-24 shrink-0" />
      <div class="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 px-4">
        <div
          role="status"
          class="fade-in-0 slide-in-from-bottom-2 mx-auto flex max-w-[calc(32rem-1.5rem)] animate-in flex-col gap-3 rounded-card border border-primary/45 bg-card/95 p-3.5 shadow-[0_16px_40px_-16px_var(--glow)] backdrop-blur-xl"
        >
          <div class="flex items-center gap-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wind class="size-[18px]" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="truncate font-semibold text-[15px]">
                {runner.runningWorkflow()?.name}
              </div>
              <div class="truncate text-muted-foreground text-xs">
                {m.workflow_stepOf({
                  current: runner.currentStep() + 1,
                  total: steps().length,
                })}
                <Show when={phaseText()}>
                  {" · "}
                  <span class="font-medium text-primary">{phaseText()}</span>
                </Show>
              </div>
            </div>
            <Button variant="soft" size="sm" onClick={() => runner.stop()}>
              <Square class="fill-current" />
              {m.common_stop()}
            </Button>
          </div>
          <div
            class="grid gap-1"
            style={{
              "grid-template-columns": `repeat(${Math.max(steps().length, 1)}, minmax(0, 1fr))`,
            }}
          >
            <Index each={steps()}>
              {(_, index) => (
                <span
                  class={cn(
                    "h-1 rounded-full bg-primary/25 transition-colors",
                    index < runner.currentStep() && "bg-primary",
                    index === runner.currentStep() &&
                      "bg-primary/70 motion-safe:animate-pulse"
                  )}
                />
              )}
            </Index>
          </div>
        </div>
      </div>
    </Show>
  );
};
