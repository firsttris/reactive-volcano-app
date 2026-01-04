import { ActiveRoundButton } from "../Button";
import { SiFireship } from "solid-icons/si";
import { useCraftyDeviceContext } from "../../provider/CraftyDeviceProvider";
import { styled } from "solid-styled-components";
import { Show } from "solid-js";

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

const WarningText = styled("div")`
  color: var(--secondary-text);
  font-size: 0.9rem;
  text-align: center;
  max-width: 300px;
`;

export const HeaterControl = () => {
  const { power, firmware } = useCraftyDeviceContext();
  const { getPowerChanged, turnHeaterOn, turnHeaterOff } = power;
  const { isOldCrafty } = firmware;

  const toggleHeater = () => {
    // Heater on/off controls only available on Crafty+ (firmware >= 2.51)
    if (isOldCrafty()) {
      console.warn("Heater controls not available on old Crafty");
      return;
    }
    
    if (getPowerChanged() > 0) {
      turnHeaterOff();
    } else {
      turnHeaterOn();
    }
  };

  return (
    <Container>
      <TextContainer>Crafty</TextContainer>
      <Show when={!isOldCrafty()} fallback={
        <WarningText>
          ⚠️ Heater controls not available on old Crafty (firmware &lt;= 2.51).<br/>
          Battery status is shown below.
        </WarningText>
      }>
        <ActiveRoundButton
          isActive={getPowerChanged() > 0}
          onClick={toggleHeater}
        >
          <SiFireship size="30px" />
        </ActiveRoundButton>
      </Show>
    </Container>
  );
};
