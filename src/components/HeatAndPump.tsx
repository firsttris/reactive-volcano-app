import { createEffect, createSignal } from "solid-js";
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
    getters: { isPumpActive, isHeatingActive },
    setters: { setHeatOn, setHeatOff, setPumpOn, setPumpOff },
  } = useCharacteristics();
  const [getIsHeatActive, setHeatActive] = createSignal<boolean>(false);
  const [getIsPumpActive, setPumpActive] = createSignal<boolean>(false);

  createEffect(() => {
    setHeatActive(isHeatingActive());
    setPumpActive(isPumpActive());
  });

  const toggleHeat = () => {
    if (getIsHeatActive()) {
      setHeatOff();
      setHeatActive(false);
    } else {
      setHeatOn();
      setHeatActive(true);
    }
  };

  const togglePump = () => {
    if (getIsPumpActive()) {
      setPumpOff();
      setPumpActive(false);
    } else {
      setPumpOn();
      setPumpActive(true);
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
