import { Component, createEffect, createMemo, createSignal } from "solid-js";
import { Slider } from "../Slider/Slider";
import { useTranslations } from "../../i18n/utils";
import { ButtonWithOrangeAnimation } from "../Button/Button";
import { useWorkflow } from "../../provider/WorkflowProvider";
import { useNavigate, useParams } from "@solidjs/router";


export const WorkflowForm: Component = () => {
  const {
    workflowSteps,
    editWorkflowStepInList,
  } = useWorkflow();

  const { workflowStepId, workflowListId } = useParams();

  const navigate = useNavigate();

  const workflowStep = createMemo(() => workflowSteps().find((workflowStep) => workflowStep.id === workflowStepId));
  const [temperature, setTemperature] = createSignal<number>(0);
  const [holdTime, setHoldTime] = createSignal<number>(0);
  const [pumpTime, setPumpTime] = createSignal<number>(0);

  createEffect(() => {
    const step = workflowStep();
    if(!step) return;
    setTemperature(step.temperature)
    setHoldTime(step.holdTimeInSeconds)
    setPumpTime(step.pumpTimeInSeconds)
  });

  const t = useTranslations();

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    editWorkflowStepInList(workflowListId, workflowStepId, { id: workflowStepId, temperature: temperature(), holdTimeInSeconds: holdTime(), pumpTimeInSeconds: pumpTime() });
    navigate(`/list/${workflowListId}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Slider
        value={temperature()}
        label={`${t("temperature")}: ${temperature()} C°`}
        min={130}
        step={1}
        max={230}
        onInput={(value) => setTemperature(value)}
      />
      <Slider
        value={holdTime()}
        label={`${t("holdTime")}: ${holdTime()} min`}
        min={1}
        step={1}
        max={20}
        onInput={(value) => setHoldTime(value)}
      />
      <Slider
        value={pumpTime()}
        label={`${t("pumpTime")}: ${pumpTime()} min`}
        min={0}
        step={1}
        max={120}
        onInput={(value) => setPumpTime(value)}
      />
      <ButtonWithOrangeAnimation type="submit">
        Submit
      </ButtonWithOrangeAnimation>
    </form>
  );
};
