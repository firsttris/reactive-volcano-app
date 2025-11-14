import { ActiveRoundButton } from "../Button";
import { SiFireship } from "solid-icons/si";
import { useCraftyDeviceContext } from "../../provider/CraftyDeviceProvider";
import { styled } from "solid-styled-components";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const TextContainer = styled("div")`
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "CustomFont";
  font-size: 50px;
  color: var(--text-color);
  min-width: 160px;
  margin-bottom: -10px;
`;

export const HeaterControl = () => {
  const { power } = useCraftyDeviceContext();
  const { getPowerChanged, turnHeaterOn, turnHeaterOff } = power;

  const toggleHeater = () => {
    if (getPowerChanged() > 0) {
      turnHeaterOff();
    } else {
      turnHeaterOn();
    }
  };

  return (
    <Container>
      <TextContainer>Crafty</TextContainer>
      <ActiveRoundButton
        isActive={getPowerChanged() > 0}
        onClick={toggleHeater}
      >
        <SiFireship size="30px" />
      </ActiveRoundButton>
    </Container>
  );
};
