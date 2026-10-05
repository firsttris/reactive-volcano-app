import Timer from "lucide-solid/icons/timer";
import { Show } from "solid-js";
import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { formatDuration } from "../../utils/heatProgress";
import { StatusNote } from "../TemperatureControls";

export const ShutdownTime = () => {
  const { state, derived } = useVolcano();

  return (
    <Show when={derived.isAutoShutdownActive()}>
      <StatusNote icon={Timer}>
        {m.device_shutdownIn({ time: formatDuration(state.autoOffRemaining) })}
      </StatusNote>
    </Show>
  );
};
