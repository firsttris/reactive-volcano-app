import { ActiveRoundButton } from "../Button";
import { SiFireship } from "solid-icons/si";
import { useCrafty } from "../../provider/CraftyProvider";
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
  const { actions, derived, isOldFirmware } = useCrafty();

  return (
    <Container>
      <TextContainer>Crafty</TextContainer>
      <Show
        when={!isOldFirmware}
        fallback={
          <WarningText>
            ⚠️ Heater controls not available on old Crafty (firmware &lt;=
            2.51).
            <br />
            Battery status is shown below.
          </WarningText>
        }
      >
        <ActiveRoundButton
          isActive={derived.isHeaterActive()}
          onClick={actions.toggleHeater}
        >
          <SiFireship size="30px" />
        </ActiveRoundButton>
      </Show>
    </Container>
  );
};
