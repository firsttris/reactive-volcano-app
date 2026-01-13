import { useCraftyDeviceContext } from "../../provider/CraftyDeviceProvider";
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
  const { temperature } = useCraftyDeviceContext();
  const { getTargetTemperature, getCurrentTemperature, setTemperature } =
    temperature;

  const t = useTranslations();
  
  const MIN_TEMP = 40;
  const MAX_TEMP = 210;

  const increaseTemperature = () => {
    const currentTemp = getTargetTemperature();
    if (currentTemp < MAX_TEMP) {
      setTemperature(currentTemp + 1);
    }
  };

  const decreaseTemperature = () => {
    const currentTemp = getTargetTemperature();
    if (currentTemp > MIN_TEMP) {
      setTemperature(currentTemp - 1);
    }
  };

  return (
    <FlexContainer>
      <TempDisplay>
        <TempLabel>{t("currentTemperature")}</TempLabel>
        <DigitalText>
          <TemperatureDisplay value={getCurrentTemperature()} unit="C" />
        </DigitalText>
      </TempDisplay>
      <TempControls>
        <RoundButton 
          onClick={decreaseTemperature}
          disabled={getTargetTemperature() <= MIN_TEMP}
        >
          <FaSolidMinus size="24px" />
        </RoundButton>
        <DigitalText isTarget={true}>
          <TemperatureDisplay value={getTargetTemperature()} unit="C" />
        </DigitalText>
        <RoundButton 
          onClick={increaseTemperature}
          disabled={getTargetTemperature() >= MAX_TEMP}
        >
          <FaSolidPlus size="24px" />
        </RoundButton>
      </TempControls>
    </FlexContainer>
  );
};
