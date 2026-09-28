import { SiFireship } from "solid-icons/si";
import { Show } from "solid-js";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";
import { useCrafty } from "../../provider/CraftyProvider";
import { ActiveRoundButton, ToggleWithLabel } from "../Button";

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
  const t = useTranslations();

  return (
    <Container>
      <TextContainer>Crafty</TextContainer>
      <Show
        when={!isOldFirmware}
        fallback={
          <WarningText>
            ⚠️ Heater controls not available on old Crafty (firmware &lt;= 2.51).
            <br />
            Battery status is shown below.
          </WarningText>
        }
      >
        <ToggleWithLabel isActive={derived.isHeaterActive()}>
          <ActiveRoundButton
            type="button"
            isActive={derived.isHeaterActive()}
            aria-pressed={derived.isHeaterActive()}
            aria-label={t("heater")}
            onClick={actions.toggleHeater}
          >
            <SiFireship size="30px" />
          </ActiveRoundButton>
          {t("heater")}
        </ToggleWithLabel>
      </Show>
    </Container>
  );
};
