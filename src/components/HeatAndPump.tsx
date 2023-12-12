import { Button } from "./Button/Button";
import { FaSolidWind } from "solid-icons/fa";
import { SiFireship } from "solid-icons/si";
import { useCharacteristics } from "../provider/CharacteristicsProvider";
import { styled } from "solid-styled-components";

const HeatButton = styled(Button)`
  margin-top: -3px;
`;

const Container = styled("div")`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 45px;

  @media (max-width: 375px) {
    gap: 25px;
  }

  @media (max-width: 320px) {
    gap: 10px;
  }
`;

const TextContainer = styled("div")`
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "CustomFont";
  font-size: 50px;
  color: lightgrey;
  min-width: 160px;
`;

export const HeatAndPump = () => {
  const {
    getters: { isPumpActive: getIsPumpActive, isHeatingActive: getIsHeatActive },
    setters: { setHeatOn, setHeatOff, setPumpOn, setPumpOff },
  } = useCharacteristics();

  const toggleHeat = () => {
    if (getIsHeatActive()) {
      setHeatOff();
    } else {
      setHeatOn();
    }
  };

  const togglePump = () => {
    if (getIsPumpActive()) {
      setPumpOff();
    } else {
      setPumpOn();
    }
  };

  return (
    <Container>
      <div>
        <HeatButton isActive={getIsHeatActive()} onClick={toggleHeat}>
          <SiFireship size="30px" />
        </HeatButton>
      </div>
      <TextContainer>HYBRID</TextContainer>
      <div>
        <HeatButton isActive={getIsPumpActive()} onClick={togglePump}>
          <FaSolidWind size="30px" style={{ transform: "rotate(270deg)" }} />
        </HeatButton>
      </div>
    </Container>
  );
};
