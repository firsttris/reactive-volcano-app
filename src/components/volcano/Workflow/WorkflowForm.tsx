
import { Component, createEffect, createMemo, createSignal } from "solid-js";
import { Slider } from "../../Slider";
import { useTranslations } from "../../../i18n/utils";
import { Button } from "../../Button";
import { useVolcanoDeviceContext } from "../../../provider/VolcanoDeviceProvider";
import { useNavigate, useParams } from "@solidjs/router";
import { buildRoute } from "../../../routes";
import { styled } from "solid-styled-components";
import { FiSave, FiX } from "solid-icons/fi";

const Container = styled("div")`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
`;

const Card = styled("div")`
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border-color);
`;

const Title = styled("h2")`
  color: var(--accent-color);
  font-size: 1.5rem;
  margin-bottom: 24px;
  text-align: center;
  font-family: CustomFont;
`;

const Form = styled("form")`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SliderSection = styled("div")`
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
`;

const ButtonGroup = styled("div")`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
`;

const StyledButton = styled(Button)`
  min-width: 140px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1rem;
`;

export const WorkflowForm: Component = () => {
  const { workflow } = useVolcanoDeviceContext();
  const { workflowSteps, editWorkflowStepInList } = workflow;

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
    navigate(buildRoute.workflowList(workflowListId));
  };

  return (
    <Container>
      <Card>
        <Title>{t("editStep")}</Title>
        <Form onSubmit={handleSubmit}>
          <SliderSection>
            <Slider
              value={temperature()}
              label={`${t("temperature")}: ${temperature()} °C`}
              min={150}
              step={5}
              max={230}
              onInput={(value) => setTemperature(value)}
            />
          </SliderSection>
          <SliderSection>
            <Slider
              value={holdTime()}
              label={`${t("holdTime")}: ${holdTime()} ${t("sec")}`}
              min={0}
              step={5}
              max={60}
              onInput={(value) => setHoldTime(value)}
            />
          </SliderSection>
          <SliderSection>
            <Slider
              value={pumpTime()}
              label={`${t("pumpTime")}: ${pumpTime()} ${t("sec")}`}
              min={30}
              step={5}
              max={180}
              onInput={(value) => setPumpTime(value)}
            />
          </SliderSection>
          <ButtonGroup>
            <StyledButton
              type="button"
              onClick={() => navigate(buildRoute.workflowList(workflowListId))}
            >
              <FiX size={20} />
              {t("cancel")}
            </StyledButton>
            <StyledButton type="submit">
              <FiSave size={20} />
              {t("save")}
            </StyledButton>
          </ButtonGroup>
        </Form>
      </Card>
    </Container>
  );
};
