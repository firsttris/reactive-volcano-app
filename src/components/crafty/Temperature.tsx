import { FaSolidMinus, FaSolidPlus } from "solid-icons/fa";
import { styled } from "solid-styled-components";
import { Limits } from "../../devices/crafty/protocol";
import { m } from "../../paraglide/messages";
import { useCrafty } from "../../provider/CraftyProvider";
import { HeatProgress } from "../HeatProgress";
import { RepeatButton } from "../RepeatButton";
import { TemperatureDisplay } from "../TemperatureDisplay";

const TempDisplay = styled("div")`
  text-align: center;
  margin-bottom: 24px;
`;

const TempLabel = styled("span")`
  display: block;
  font-size: 0.9rem;
  color: var(--secondary-text);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DigitalText = styled("div")<{ isTarget?: boolean }>`
  margin-bottom: -10px;
  font-family: "CustomFont";
  font-size: 72px;
  line-height: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.isTarget ? "var(--text-color)" : "var(--accent-color)")};
  transition: all 0.3s ease;

  ${(props) =>
    !props.isTarget
      ? `
        text-shadow:
          0 0 10px rgba(255, 102, 0, 0.8),
          0 0 20px rgba(255, 102, 0, 0.6);
      `
      : ""}
`;

const FlexContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
`;

const TempControls = styled("div")`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 300px;
  padding: 0 20px;

  @media (max-width: 375px) {
    max-width: 250px;
    padding: 0 15px;
  }

  @media (max-width: 320px) {
    max-width: 200px;
    padding: 0 10px;
  }
`;

export const Temperature = () => {
  const { state, actions, derived } = useCrafty();

  const increaseTemperature = () => actions.setTargetTemp(state.targetTemp + 1);
  const decreaseTemperature = () => actions.setTargetTemp(state.targetTemp - 1);

  return (
    <FlexContainer>
      <TempDisplay>
        <TempLabel>{m.temperature_current()}</TempLabel>
        <DigitalText>
          <TemperatureDisplay value={state.currentTemp} unit="C" />
        </DigitalText>
      </TempDisplay>
      <HeatProgress
        current={state.currentTemp}
        target={state.targetTemp}
        heating={derived.isHeaterActive()}
        reached={derived.isSetpointReached()}
      />
      <TempControls>
        <RepeatButton
          onStep={decreaseTemperature}
          disabled={state.targetTemp <= Limits.MIN_TEMP}
          aria-label={m.temperature_decrease()}
        >
          <FaSolidMinus size="24px" />
        </RepeatButton>
        <DigitalText isTarget={true}>
          <TemperatureDisplay value={state.targetTemp} unit="C" />
        </DigitalText>
        <RepeatButton
          onStep={increaseTemperature}
          disabled={state.targetTemp >= Limits.MAX_TEMP}
          aria-label={m.temperature_increase()}
        >
          <FaSolidPlus size="24px" />
        </RepeatButton>
      </TempControls>
    </FlexContainer>
  );
};
