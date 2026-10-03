import { styled } from "solid-styled-components";
import { m } from "../../paraglide/messages";
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

  return (
    <StyledDiv isVisible={derived.isAutoShutdownActive()}>
      <div>{m.device_shutdownIn({ seconds: state.autoOffRemaining })}</div>
    </StyledDiv>
  );
};
