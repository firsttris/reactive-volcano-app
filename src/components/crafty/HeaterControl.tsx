import { ActiveRoundButton } from "../Button";
import { SiFireship } from "solid-icons/si";
import { useCraftyDeviceContext } from "../../provider/CraftyDeviceProvider";
import { styled } from "solid-styled-components";

const Container = styled("div")`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 45px;

  @media (max-width: 375px) {
    gap: 25px;
  }

  @media (max-width: 320px) {
    gap: 5px;
  }
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
      <div>
        <ActiveRoundButton
          isActive={getPowerChanged() > 0}
          onClick={toggleHeater}
        >
          <SiFireship size="30px" />
        </ActiveRoundButton>
      </div>
      <TextContainer>Crafty</TextContainer>
      <div></div>
    </Container>
  );
};
