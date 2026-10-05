import Timer from "lucide-solid/icons/timer";
import { Show } from "solid-js";
import { m } from "../../paraglide/messages";
import { useCrafty } from "../../provider/CraftyProvider";
import { formatDuration } from "../../utils/heatProgress";
import { StatusNote } from "../TemperatureControls";

/**
 * Once the target temperature is reached, the Crafty+ counts down to its automatic shutdown.
 */
export const ShutdownTime = () => {
  const { state, derived, isOldFirmware } = useCrafty();

  const isVisible = () =>
    !isOldFirmware &&
    derived.isHeaterActive() &&
    derived.isSetpointReached() &&
    state.autoOffRemaining !== null;

  return (
    <Show when={isVisible()}>
      <StatusNote icon={Timer}>
        {m.device_shutdownIn({
          time: formatDuration(state.autoOffRemaining ?? 0),
        })}
      </StatusNote>
    </Show>
  );
};
