import { FaSolidWind } from "solid-icons/fa";
import { SiFireship } from "solid-icons/si";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";
import { useVolcano } from "../../provider/VolcanoProvider";
import { ActiveRoundButton } from "../Button";

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

export const HeatAndPump = () => {
  const { actions, derived } = useVolcano();
  const t = useTranslations();

  const toggleHeat = () => actions.setHeater(!derived.isHeating());
  const togglePump = () => actions.setPump(!derived.isPumpActive());

  return (
    <Container>
      <div>
        <ActiveRoundButton isActive={derived.isHeating()} onClick={toggleHeat}>
          <SiFireship size="30px" />
        </ActiveRoundButton>
      </div>
      <TextContainer>{t("hybrid")}</TextContainer>
      <div>
        <ActiveRoundButton
          isActive={derived.isPumpActive()}
          onClick={togglePump}
        >
          <FaSolidWind size="30px" style={{ transform: "rotate(270deg)" }} />
        </ActiveRoundButton>
      </div>
    </Container>
  );
};
