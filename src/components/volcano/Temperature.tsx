import { useVolcanoDeviceContext } from "../../provider/VolcanoDeviceProvider";
import { styled } from "solid-styled-components";
import { FaSolidMinus } from "solid-icons/fa";
import { FaSolidPlus } from "solid-icons/fa";
import { RoundButton } from "../Button";
import { TemperatureDisplay } from "../TemperatureDisplay";
import { useTranslations } from "../../i18n/utils";

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
  const { temperature, deviceSetting } = useVolcanoDeviceContext();
  const { getTargetTemperature, getCurrentTemperature, setTargetTemperature } =
    temperature;
  const { isCelsius } = deviceSetting;

  const t = useTranslations();

  const increaseTemperature = () => {
    setTargetTemperature(getTargetTemperature() + 1);
  };

  const decreaseTemperature = () => {
    setTargetTemperature(getTargetTemperature() - 1);
  };

  return (
    <FlexContainer>
      <TempDisplay>
        <TempLabel>{t("currentTemperature")}</TempLabel>
        <DigitalText>
          <TemperatureDisplay
            value={getCurrentTemperature()}
            unit={isCelsius() ? "C" : "F"}
          />
        </DigitalText>
      </TempDisplay>
      <TempControls>
        <RoundButton onClick={decreaseTemperature}>
          <FaSolidMinus size="24px" />
        </RoundButton>
        <DigitalText isTarget={true}>
          <TemperatureDisplay
            value={getTargetTemperature()}
            unit={isCelsius() ? "C" : "F"}
          />
        </DigitalText>
        <RoundButton onClick={increaseTemperature}>
          <FaSolidPlus size="24px" />
        </RoundButton>
      </TempControls>
    </FlexContainer>
  );
};
