import { FaSolidMinus, FaSolidPlus } from "solid-icons/fa";
import { styled } from "solid-styled-components";
import { Limits } from "../../devices/volcano/protocol";
import { useTranslations } from "../../i18n/utils";
import { useVolcano } from "../../provider/VolcanoProvider";
import { convertCelsiusToFahrenheit } from "../../utils/bluetoothUtils";
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
  color: ${(props) => (props.isTarget ? "var(--text-color)" : "#f60")};
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
  gap: 20px;
`;

const TempControls = styled("div")`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 45px;

  @media (max-width: 375px) {
    gap: 25px;
  }

  @media (max-width: 320px) {
    gap: 5px;
  }
`;

export const Temperature = () => {
  const { state, actions, derived } = useVolcano();
  const isCelsius = derived.isCelsius;

  // The Volcano always reports °C, so convert for display in Fahrenheit mode
  const toDisplayUnit = (celsius: number) =>
    isCelsius() ? celsius : convertCelsiusToFahrenheit(celsius);

  const t = useTranslations();

  const increaseTemperature = () => {
    actions.setTargetTemp(state.targetTemp + 1);
  };

  const decreaseTemperature = () => {
    actions.setTargetTemp(state.targetTemp - 1);
  };

  return (
    <FlexContainer>
      <TempDisplay>
        <TempLabel>{t("currentTemperature")}</TempLabel>
        <DigitalText>
          <TemperatureDisplay
            value={toDisplayUnit(state.currentTemp)}
            unit={isCelsius() ? "C" : "F"}
          />
        </DigitalText>
      </TempDisplay>
      <HeatProgress
        current={state.currentTemp}
        target={state.targetTemp}
        heating={derived.isHeating()}
      />
      <TempControls>
        <RepeatButton
          onStep={decreaseTemperature}
          disabled={state.targetTemp <= Limits.MIN_TEMP}
          aria-label={t("decreaseTemperature")}
        >
          <FaSolidMinus size="24px" />
        </RepeatButton>
        <DigitalText isTarget={true}>
          <TemperatureDisplay
            value={toDisplayUnit(state.targetTemp)}
            unit={isCelsius() ? "C" : "F"}
          />
        </DigitalText>
        <RepeatButton
          onStep={increaseTemperature}
          disabled={state.targetTemp >= Limits.MAX_TEMP}
          aria-label={t("increaseTemperature")}
        >
          <FaSolidPlus size="24px" />
        </RepeatButton>
      </TempControls>
    </FlexContainer>
  );
};
