import { ActiveRoundButton } from "../Button";
import { FaSolidWind } from "solid-icons/fa";
import { SiFireship } from "solid-icons/si";
import { useVolcanoDeviceContext } from "../../provider/VolcanoDeviceProvider";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";

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
  const { deviceStatus } = useVolcanoDeviceContext();
  const t = useTranslations();
  const {
    isPumpActive: getIsPumpActive,
    isHeatingActive: getIsHeatActive,
    setHeatOn,
    setHeatOff,
    setPumpOn,
    setPumpOff,
  } = deviceStatus;

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
        <ActiveRoundButton isActive={getIsHeatActive()} onClick={toggleHeat}>
          <SiFireship size="30px" />
        </ActiveRoundButton>
      </div>
      <TextContainer>{t("hybrid")}</TextContainer>
      <div>
        <ActiveRoundButton isActive={getIsPumpActive()} onClick={togglePump}>
          <FaSolidWind size="30px" style={{ transform: "rotate(270deg)" }} />
        </ActiveRoundButton>
      </div>
    </Container>
  );
};
