import { For, Show } from "solid-js";
import { useVolcanoDeviceContext } from "../../../provider/VolcanoDeviceProvider";
import { Button } from "../../Button";
import { useNavigate, useParams } from "@solidjs/router";
import { buildRoute } from "../../../routes";
import { FiEdit2, FiTrash2, FiPlus, FiSave, FiX } from "solid-icons/fi";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../../i18n/utils";

const Container = styled("div")`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background-image: url('./background.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
`;

const Card = styled("div")`
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border-color);
  margin-bottom: 20px;
  background-image: url('./background.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;

`;

const Title = styled("h2")`
  color: var(--accent-color);
  font-size: 1.5rem;
  margin-bottom: 24px;
  text-align: center;
  font-family: CustomFont;
`;

const StepList = styled("ol")`
  list-style: none;
  counter-reset: step-counter;
  padding: 0;
  margin: 0 0 24px 0;
`;

const StepItem = styled("li")`
  counter-increment: step-counter;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
  transition: all 0.3s ease;

  &::before {
    content: counter(step-counter);
    position: absolute;
    left: 16px;
    top: 16px;
    width: 32px;
    height: 32px;
    background: var(--accent-color);
    color: var(--text-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-family: CustomFont;
  }

  &:hover {
    border-color: var(--accent-color);
    background: rgba(255, 102, 0, 0.05);
  }
`;

const StepContent = styled("div")`
  margin-left: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StepDetails = styled("div")`
  flex: 1;
  color: var(--secondary-text);
  font-size: 0.95rem;
`;

const StepLabel = styled("div")`
  color: var(--secondary-text);
  font-size: 0.85rem;
  margin-bottom: 4px;
`;

const StepValue = styled("div")`
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
  font-family: CustomFont;
`;

const StepActions = styled("div")`
  display: flex;
  gap: 8px;
`;

const IconButton = styled("button")`
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--secondary-text);
  transition: all 0.2s ease;

  &:hover {
    background: var(--secondary-bg);
    color: var(--accent-color);
    border-color: var(--accent-color);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ButtonGroup = styled("div")`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const StyledButton = styled(Button)`
  min-width: 120px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1rem;
`;

const EmptyState = styled("div")`
  text-align: center;
  padding: 40px;
  color: var(--secondary-text);
  font-size: 1rem;
`;

export const WorkflowList = () => {
  const { workflow } = useVolcanoDeviceContext();
  const t = useTranslations();
  const {
    deleteWorkflowStepFromList,
    workflowSteps,
    updateWorkflowStepsInList,
    addNewWorkflowStep,
  } = workflow;

  const { workflowListId } = useParams();
  const navigate = useNavigate();

  return (
    <Container>
      <Card>
      <div style={{ "margin-bottom": "20px", "background-image": "url('./background.png')", "background-position": "center", "background-size": "cover", "background-repeat": "no-repeat" }}>
        <Title>{t("editWorkflowSteps")}</Title>
        <Show
          when={workflowSteps().length > 0}
          fallback={<EmptyState>{t("noStepsYet")}</EmptyState>}
        >
          <StepList>
            <For each={workflowSteps()}>
              {(workflowItem) => (
                <StepItem>
                  <StepContent>
                    <StepDetails>
                      <StepLabel>{t("temperature")}</StepLabel>
                      <StepValue>{workflowItem.temperature}°C</StepValue>
                    </StepDetails>
                    <StepDetails>
                      <StepLabel>{t("holdTime")}</StepLabel>
                      <StepValue>{workflowItem.holdTimeInSeconds}</StepValue>
                    </StepDetails>
                    <StepDetails>
                      <StepLabel>{t("pumpTime")}</StepLabel>
                      <StepValue>{workflowItem.pumpTimeInSeconds}</StepValue>
                    </StepDetails>
                    <StepActions>
                      <IconButton
                        onClick={() =>
                          navigate(
                            buildRoute.workflowForm(
                              workflowListId,
                              workflowItem.id
                            )
                          )
                        }
                      >
                        <FiEdit2 size={18} />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          deleteWorkflowStepFromList(
                            workflowListId,
                            workflowItem.id
                          )
                        }
                      >
                        <FiTrash2 size={18} />
                      </IconButton>
                    </StepActions>
                  </StepContent>
                </StepItem>
              )}
            </For>
          </StepList>
        </Show>
        <ButtonGroup>
          <StyledButton onClick={() => navigate(buildRoute.volcanoRoot())}>
            <FiX size={20} />
            {t("cancel")}
          </StyledButton>
          <StyledButton onClick={() => addNewWorkflowStep()}>
            <FiPlus size={20} />
            {t("add")}
          </StyledButton>
          <StyledButton
            onClick={() => {
              updateWorkflowStepsInList(workflowListId, workflowSteps());
              navigate(buildRoute.volcanoRoot());
            }}
          >
            <FiSave size={20} />
            {t("save")}
          </StyledButton>
        </ButtonGroup>
      </div>
      </Card>
    </Container>
  );
};
