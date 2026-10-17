import { useNavigate, useParams } from "@solidjs/router";
import Save from "lucide-solid/icons/save";
import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import { m } from "../../../paraglide/messages";
import { useVolcano } from "../../../provider/VolcanoProvider";
import { useWorkflowContext } from "../../../provider/WorkflowProvider";
import { buildRoute } from "../../../routes";
import {
  formatTemperature,
  fromDisplayTemperature,
  toDisplayTemperature,
} from "../../../utils/bluetoothUtils";
import { SettingSlider, SettingsSection } from "../../Settings";
import { Button } from "../../ui/button";
import { EditorHeader } from "./EditorHeader";

export const WorkflowForm: Component = () => {
  const { stepsOf, editWorkflowStepInList } = useWorkflowContext();
  const { derived } = useVolcano();
  const isCelsius = derived.isCelsius;
  // Not destructured, so the form follows a change of the route
  const params = useParams();
  const workflowId = () => params.workflowListId ?? "";
  const stepId = () => params.workflowStepId ?? "";
  const navigate = useNavigate();

  const workflowStep = createMemo(() =>
    stepsOf(workflowId()).find((workflowStep) => workflowStep.id === stepId())
  );

  const [temperature, setTemperature] = createSignal<number>(185);
  const [holdTime, setHoldTime] = createSignal<number>(0);
  const [pumpTime, setPumpTime] = createSignal<number>(0);

  createEffect(() => {
    const step = workflowStep();
    if (!step) return;
    setTemperature(step.temperature);
    setHoldTime(step.holdTimeInSeconds);
    setPumpTime(step.pumpTimeInSeconds);
  });

  const backToSteps = () => navigate(buildRoute.workflowList(workflowId()));

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    if (!workflowStep()) return;
    editWorkflowStepInList(workflowId(), stepId(), {
      id: stepId(),
      temperature: temperature(),
      holdTimeInSeconds: holdTime(),
      pumpTimeInSeconds: pumpTime(),
    });
    backToSteps();
  };

  return (
    <form class="flex flex-col gap-4" onSubmit={handleSubmit}>
      <EditorHeader title={m.workflow_editStep()} onBack={backToSteps} />
      <SettingsSection title={m.workflow_editStep()}>
        <SettingSlider
          label={m.workflow_temperature()}
          // Steps are stored in °C, edited in the unit set on the device:
          // 5° jumps, −/+ for single degrees
          valueLabel={formatTemperature(temperature(), isCelsius())}
          value={toDisplayTemperature(temperature(), isCelsius())}
          min={isCelsius() ? 150 : 300}
          max={isCelsius() ? 230 : 445}
          step={5}
          fineTuning={{
            step: 1,
            decreaseLabel: m.temperature_decrease(),
            increaseLabel: m.temperature_increase(),
          }}
          onChange={(value) =>
            setTemperature(fromDisplayTemperature(value, isCelsius()))
          }
        />
        <SettingSlider
          label={m.workflow_holdTime()}
          valueLabel={`${holdTime()} s`}
          value={holdTime()}
          min={0}
          max={60}
          step={5}
          onChange={setHoldTime}
        />
        <SettingSlider
          label={m.workflow_pumpTime()}
          valueLabel={`${pumpTime()} s`}
          value={pumpTime()}
          min={0}
          max={60}
          step={5}
          onChange={setPumpTime}
        />
      </SettingsSection>
      <div class="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={backToSteps}>
          {m.common_cancel()}
        </Button>
        <Button type="submit">
          <Save />
          {m.common_save()}
        </Button>
      </div>
    </form>
  );
};
