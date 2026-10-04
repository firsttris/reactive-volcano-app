import Activity from "lucide-solid/icons/activity";
import CircleCheck from "lucide-solid/icons/circle-check";
import LoaderCircle from "lucide-solid/icons/loader-circle";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import {
  type Component,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from "solid-js";
import type { AnalysisResult } from "../devices/shared/analysis";
import { m } from "../paraglide/messages";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

type AnalysisState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; result: AnalysisResult }
  | { kind: "failed" };

/** Runs the device self-check and shows its findings */
export const AnalysisSection: Component<{
  run: () => Promise<AnalysisResult>;
}> = (props) => {
  const [analysis, setAnalysis] = createSignal<AnalysisState>({
    kind: "idle",
  });

  const start = async () => {
    setAnalysis({ kind: "running" });
    try {
      setAnalysis({ kind: "done", result: await props.run() });
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis({ kind: "failed" });
    }
  };

  const result = () => {
    const current = analysis();
    return current.kind === "done" ? current.result : undefined;
  };

  return (
    <div class="flex flex-col gap-3 px-4 py-3.5">
      <Button
        variant="secondary"
        class="w-full"
        disabled={analysis().kind === "running"}
        onClick={start}
      >
        <Show when={analysis().kind === "running"} fallback={<Activity />}>
          <LoaderCircle class="animate-spin" />
        </Show>
        {analysis().kind === "running"
          ? m.analysis_running()
          : m.analysis_start()}
      </Button>
      <Switch>
        <Match when={analysis().kind === "failed"}>
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{m.analysis_failed()}</AlertTitle>
          </Alert>
        </Match>
        <Match when={result()}>
          {(done) => (
            <>
              <Switch>
                <Match when={done().findings.length > 0}>
                  <Alert variant="accent">
                    <TriangleAlert />
                    <AlertTitle>{m.analysis_title()}</AlertTitle>
                    <AlertDescription>
                      <ul class="list-disc space-y-1.5 pl-4">
                        <For each={done().findings}>
                          {(finding) => <li>{m[finding]()}</li>}
                        </For>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </Match>
                <Match when={!done().errorReport}>
                  <Alert>
                    <CircleCheck class="!text-success" />
                    <AlertTitle>{m.analysis_ok()}</AlertTitle>
                  </Alert>
                </Match>
              </Switch>
              <Show when={done().errorReport}>
                {(report) => (
                  <Alert variant="destructive">
                    <TriangleAlert />
                    <AlertTitle>{m.analysis_contactSupport()}</AlertTitle>
                    <AlertDescription>
                      <pre class="select-text whitespace-pre-wrap break-all rounded-lg bg-muted p-3 font-mono text-foreground text-xs">
                        {report()}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </Show>
            </>
          )}
        </Match>
      </Switch>
    </div>
  );
};
