import { Component, createEffect, createMemo, createSignal } from "solid-js";
import { Slider } from "../Slider/Slider";
import { useTranslations } from "../../i18n/utils";
import { ButtonWithOrangeAnimation } from "../Button/Button";
import { useWorkflow } from "../../provider/WorkflowProvider";
import { useNavigate, useParams } from "@solidjs/router";
import { styled } from "solid-styled-components";

const ResponsiveContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 25px;
  max-width: 600px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    margin: 0px;
    max-width: unset;
  }
`;

export const WorkflowForm: Component = () => {
  const { workflowSteps, editWorkflowStepInList } = useWorkflow();

  const { workflowStepId, workflowListId } = useParams();

  const navigate = useNavigate();

  const workflowStep = createMemo(() =>
    workflowSteps().find((workflowStep) => workflowStep.id === workflowStepId)
  );
  const [temperature, setTemperature] = createSignal<number>(0);
  const [holdTime, setHoldTime] = createSignal<number>(0);
  const [pumpTime, setPumpTime] = createSignal<number>(0);

  createEffect(() => {
    const step = workflowStep();
    if (!step) return;
    setTemperature(step.temperature);
    setHoldTime(step.holdTimeInSeconds);
    setPumpTime(step.pumpTimeInSeconds);
  });

  const t = useTranslations();

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    editWorkflowStepInList(workflowListId, workflowStepId, {
      id: workflowStepId,
      temperature: temperature(),
      holdTimeInSeconds: holdTime(),
      pumpTimeInSeconds: pumpTime(),
    });
    navigate(`/list/${workflowListId}`);
  };

  return (
    <ResponsiveContainer>
      <form onSubmit={handleSubmit}>
        <Slider
          value={temperature()}
          label={`${t("temperature")}: ${temperature()} C°`}
          min={150}
          step={5}
          max={210}
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
          step={4}
          max={120}
          onInput={(value) => setPumpTime(value)}
        />
        <div style={{ "margin-top": "20px", display: "flex", gap: '10px' }}>
          <ButtonWithOrangeAnimation
            onClick={() => navigate(`/list/${workflowListId}`)}
          >
            Cancel
          </ButtonWithOrangeAnimation>
          <ButtonWithOrangeAnimation
            type="submit"
          >
            Submit
          </ButtonWithOrangeAnimation>
        </div>
      </form>
    </ResponsiveContainer>
  );
};
