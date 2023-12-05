import { createEffect, createSignal } from "solid-js";
import { useCharacteristics } from "../provider/CharacteristicsProvider";
import { styled } from "solid-styled-components";
import { FaSolidMinus } from "solid-icons/fa";
import { FaSolidPlus } from "solid-icons/fa";
import { ButtonWithOrangeAnimation } from "./Button/Button";

const TempButton = styled(ButtonWithOrangeAnimation)`
  margin-top: -15px;
`;

const DigitalText = styled("div")`
  font-family: "CustomFont";
  font-size: 72px;
  line-height: 1;
  min-width: 160px;
  display: flex;
  align-items: end;
  flex-direction: column;
`;

const CurrentTemperature = styled(DigitalText)`
  color: #f60;
`;

const FlexContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const CenteredContainer = styled("div")`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 45px;

  @media (max-width: 320px) {
    gap: 10px;
  }
`;

export const Temperature = () => {
  const [targetTemp, setTargetTemp] = createSignal(0);

  const {
    getters: { getTargetTemperature, getCurrentTemperature, isCelsius },
    setters: { setTemperature },
  } = useCharacteristics();

  createEffect(() => {
    setTargetTemp(getTargetTemperature());
  });

  const increaseTemperature = () => {
    setTemperature(targetTemp() + 1);
    setTargetTemp(targetTemp() + 1);
  };

  const decreaseTemperature = () => {
    setTemperature(targetTemp() - 1);
    setTargetTemp(targetTemp() - 1);
  };

  const isCelsiusOrFahrenheit = () => {
    if (isCelsius()) {
      return "°C";
    } else {
      return "°F";
    }
  };

  return (
    <FlexContainer>
      <CurrentTemperature>{`${getCurrentTemperature()} ${isCelsiusOrFahrenheit()}`}</CurrentTemperature>
      <CenteredContainer>
        <TempButton onClick={decreaseTemperature}>
          <FaSolidMinus size="30px" />
        </TempButton>{" "}
        <DigitalText>{`${targetTemp()} ${isCelsiusOrFahrenheit()}`}</DigitalText>
        <TempButton onClick={increaseTemperature}>
          <FaSolidPlus size="30px" />
        </TempButton>
      </CenteredContainer>
    </FlexContainer>
  );
};
