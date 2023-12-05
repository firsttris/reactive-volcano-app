import { useCharacteristics } from "../provider/CharacteristicsProvider";
import { styled } from "solid-styled-components";

interface StyledDivProps {
  isVisible: boolean;
}

const StyledDiv = styled("div")<StyledDivProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: ${(props) => (props.isVisible ? "visible" : "hidden")};
  font-family: CustomFont;
`;

export const ShutdownTime = () => {
  const {
    getters: { isAutoShutdownActive, getAutoOffTimeInSec },
  } = useCharacteristics();

  return (
      <StyledDiv isVisible={isAutoShutdownActive()}>
        <div>Device will Shutdown in {getAutoOffTimeInSec()} sec</div>
      </StyledDiv>
  );
};
