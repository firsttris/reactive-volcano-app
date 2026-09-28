import { FaSolidWind } from "solid-icons/fa";
import { SiFireship } from "solid-icons/si";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";
import { useVolcano } from "../../provider/VolcanoProvider";
import { ActiveRoundButton, ToggleWithLabel } from "../Button";

const Container = styled("div")`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
`;

const TextContainer = styled("div")`
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "CustomFont";
  font-size: 50px;
  color: var(--text-color);
  flex: 1;
  height: 60px;

  @media (max-width: 375px) {
    font-size: 36px;
  }
`;

export const HeatAndPump = () => {
  const { actions, derived } = useVolcano();
  const t = useTranslations();

  const toggleHeat = () => actions.setHeater(!derived.isHeating());
  const togglePump = () => actions.setPump(!derived.isPumpActive());

  return (
    <Container>
      <ToggleWithLabel isActive={derived.isHeating()}>
        <ActiveRoundButton
          type="button"
          isActive={derived.isHeating()}
          aria-pressed={derived.isHeating()}
          aria-label={t("heater")}
          onClick={toggleHeat}
        >
          <SiFireship size="30px" />
        </ActiveRoundButton>
        {t("heater")}
      </ToggleWithLabel>
      <TextContainer>{t("hybrid")}</TextContainer>
      <ToggleWithLabel isActive={derived.isPumpActive()}>
        <ActiveRoundButton
          type="button"
          isActive={derived.isPumpActive()}
          aria-pressed={derived.isPumpActive()}
          aria-label={t("pump")}
          onClick={togglePump}
        >
          <FaSolidWind size="30px" style={{ transform: "rotate(270deg)" }} />
        </ActiveRoundButton>
        {t("pump")}
      </ToggleWithLabel>
    </Container>
  );
};
