import { Show } from "solid-js";
import { styled } from "solid-styled-components";
import { useTranslations } from "../../i18n/utils";
import { useCrafty } from "../../provider/CraftyProvider";

const StyledDiv = styled("div")`
  display: flex;
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

/**
 * Like the legacy app: once the target temperature is reached, the Crafty+
 * counts down to its automatic shutdown.
 */
export const ShutdownTime = () => {
  const { state, derived, isOldFirmware } = useCrafty();
  const t = useTranslations();

  const isVisible = () =>
    !isOldFirmware &&
    derived.isHeaterActive() &&
    derived.isSetpointReached() &&
    state.autoOffRemaining !== null;

  return (
    <Show when={isVisible()}>
      <StyledDiv>
        <div>
          {t("deviceWillShutdownIn")} {state.autoOffRemaining} {t("sec")}
        </div>
      </StyledDiv>
    </Show>
  );
};
