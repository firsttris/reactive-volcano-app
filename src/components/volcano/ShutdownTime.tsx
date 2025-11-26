import { useVolcanoDeviceContext } from "../../provider/VolcanoDeviceProvider";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";

interface StyledDivProps {
  isVisible: boolean;
}

const StyledDiv = styled("div")<StyledDivProps>`
  display: ${(props) => (props.isVisible ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  font-family: CustomFont;
  background: rgba(255, 102, 0, 0.1);
  border: 1px solid var(--accent-color);
  border-radius: 8px;
  padding: 12px 20px;
  color: var(--accent-color);
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  min-width: 800px;
`;

export const ShutdownTime = () => {
  const { deviceStatus, shutdowntime } = useVolcanoDeviceContext();
  const { isAutoShutdownActive } = deviceStatus;
  const { getAutoOffTimeInSec } = shutdowntime;

  const t = useTranslations();

  return (
    <StyledDiv isVisible={isAutoShutdownActive()}>
      <div>
        {t("deviceWillShutdownIn")} {getAutoOffTimeInSec()} {t("sec")}
      </div>
    </StyledDiv>
  );
};
