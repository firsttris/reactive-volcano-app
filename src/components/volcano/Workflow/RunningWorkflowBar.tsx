import { FiSquare } from "solid-icons/fi";
import { createSignal, onCleanup, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../../i18n/utils";
import { useVolcano } from "../../../provider/VolcanoProvider";
import { useWorkflowRunner } from "../../../provider/WorkflowRunnerProvider";
import { convertCelsiusToFahrenheit } from "../../../utils/bluetoothUtils";
import { formatDuration } from "../../../utils/heatProgress";

const BAR_HEIGHT = "72px";

// Keeps the end of the page reachable behind the fixed bar
const Spacer = styled("div")`
  height: ${BAR_HEIGHT};
`;

const Bar = styled("div")`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--bg-color);
  border-top: 1px solid var(--accent-color);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.15);
`;

const Content = styled("div")`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 600px;
  height: ${BAR_HEIGHT};
  box-sizing: border-box;
  padding: 0 20px;
`;

const Info = styled("div")`
  flex: 1;
  min-width: 0;
`;

const Name = styled("div")`
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Detail = styled("div")`
  font-size: 0.85rem;
  color: var(--secondary-text);
`;

const PhaseText = styled("span")`
  color: var(--accent-color);
  font-weight: 600;
`;

const StopButton = styled("button")`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: 22px;
  background: #d32f2f;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
`;

const Progress = styled("div")`
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--accent-color);
  transition: width 0.3s ease;
`;

export const RunningWorkflowBar = () => {
  const runner = useWorkflowRunner();
  const { derived } = useVolcano();
  const t = useTranslations();

  const [now, setNow] = createSignal(Date.now());
  const timer = setInterval(() => setNow(Date.now()), 500);
  onCleanup(() => clearInterval(timer));

  const totalSteps = () => runner.runningWorkflow()?.workflowSteps.length ?? 0;
  const progress = () =>
    totalSteps() === 0 ? 0 : (runner.currentStep() / totalSteps()) * 100;

  const formatTemp = (celsius: number) =>
    derived.isCelsius()
      ? `${celsius}°C`
      : `${convertCelsiusToFahrenheit(celsius)}°F`;

  const phaseText = () => {
    const phase = runner.phase();
    if (!phase) return "";
    if (phase.type === "heating") {
      return `${t("heatingTo")} ${formatTemp(phase.targetTemp)}`;
    }
    const seconds = Math.max(0, Math.ceil((phase.endsAt - now()) / 1000));
    const label = phase.type === "holding" ? t("holding") : t("pumping");
    return `${label} ${formatDuration(seconds)}`;
  };

  return (
    <Show when={runner.isRunning()}>
      <Spacer />
      <Bar role="status">
        <Progress style={{ width: `${progress()}%` }} />
        <Content>
          <Info>
            <Name>{runner.runningWorkflow()?.name}</Name>
            <Detail>
              {t("step")} {runner.currentStep() + 1}/{totalSteps()}
              <Show when={phaseText()}>
                {" · "}
                <PhaseText>{phaseText()}</PhaseText>
              </Show>
            </Detail>
          </Info>
          <StopButton type="button" onClick={() => runner.stop()}>
            <FiSquare size={16} />
            {t("stop")}
          </StopButton>
        </Content>
      </Bar>
    </Show>
  );
};
