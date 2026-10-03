import {
  type Component,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from "solid-js";
import { styled } from "solid-styled-components";
import type { AnalysisResult } from "../devices/shared/analysis";
import { m } from "../paraglide/messages";
import { Button } from "./Button";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
`;

const StartButton = styled(Button)`
  width: 200px;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const Message = styled("div")`
  color: var(--text-color);
  font-size: 0.95rem;
  text-align: center;
`;

const FindingList = styled("ul")`
  color: var(--text-color);
  font-size: 0.95rem;
  margin: 0;
  padding-left: 20px;
  align-self: stretch;

  li + li {
    margin-top: 6px;
  }
`;

const Report = styled("pre")`
  align-self: stretch;
  margin: 0;
  padding: 10px;
  background: var(--secondary-bg);
  border-radius: 5px;
  color: var(--text-color);
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
`;

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
    <Container>
      <StartButton
        type="button"
        disabled={analysis().kind === "running"}
        onClick={start}
      >
        {analysis().kind === "running"
          ? m.analysis_running()
          : m.analysis_start()}
      </StartButton>
      <Switch>
        <Match when={analysis().kind === "failed"}>
          <Message>{m.analysis_failed()}</Message>
        </Match>
        <Match when={result()}>
          {(done) => (
            <>
              <Switch>
                <Match when={done().findings.length > 0}>
                  <FindingList>
                    <For each={done().findings}>
                      {(finding) => <li>{m[finding]()}</li>}
                    </For>
                  </FindingList>
                </Match>
                <Match when={!done().errorReport}>
                  <Message>{m.analysis_ok()}</Message>
                </Match>
              </Switch>
              <Show when={done().errorReport}>
                {(report) => (
                  <>
                    <Message>{m.analysis_contactSupport()}</Message>
                    <Report>{report()}</Report>
                  </>
                )}
              </Show>
            </>
          )}
        </Match>
      </Switch>
    </Container>
  );
};
