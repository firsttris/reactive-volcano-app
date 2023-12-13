import { Component, createMemo } from "solid-js";
import { Slider } from "../Slider/Slider";
import { useTranslations } from "../../i18n/utils";
import { ButtonWithOrangeAnimation } from "../Button/Button";
import { useWorkflow } from "../../provider/WorkflowProvider";

type WorkflowFormProps = {
  onSubmit: (temperature: number, holdTime: number, pumpTime: number) => void;
};

export const WorkflowForm: Component<WorkflowFormProps> = (props) => {
  const {
    workflowStep,
    editWorkflowStep,
    workflowStepIndex,
    workflowListIndex,
  } = useWorkflow();

  const temperature = createMemo(() => workflowStep().temperature);
  const holdTime = createMemo(() => workflowStep().holdTimeInSeconds);
  const pumpTime = createMemo(() => workflowStep().pumpTimeInSeconds);

  const t = useTranslations();

  const handleSubmit = (event: Event) => {
    const { temperature, holdTimeInSeconds, pumpTimeInSeconds } =
      workflowStep();
    event.preventDefault();
    props.onSubmit(temperature, holdTimeInSeconds, pumpTimeInSeconds);
  };

  const setTemperature = (value: number) => {
    editWorkflowStep(workflowListIndex(), workflowStepIndex(), {
      ...workflowStep(),
      temperature: value,
    });
  };

  const setHoldTime = (value: number) => {
    editWorkflowStep(workflowListIndex(), workflowStepIndex(), {
      ...workflowStep(),
      holdTimeInSeconds: value,
    });
  };

  const setPumpTime = (value: number) => {
    editWorkflowStep(workflowListIndex(), workflowStepIndex(), {
      ...workflowStep(),
      pumpTimeInSeconds: value,
    });
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
