import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";
import { useVolcano } from "../../provider/VolcanoProvider";

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
`;

export const ShutdownTime = () => {
  const { state, derived } = useVolcano();

  const t = useTranslations();

  return (
    <StyledDiv isVisible={derived.isAutoShutdownActive()}>
      <div>
        {t("deviceWillShutdownIn")} {state.autoOffRemaining} {t("sec")}
      </div>
    </StyledDiv>
  );
};
