import Timer from "lucide-solid/icons/timer";
import { Show } from "solid-js";
import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { StatusNote } from "../TemperatureControls";

export const ShutdownTime = () => {
  const { state, derived } = useVolcano();

  return (
    <Show when={derived.isAutoShutdownActive()}>
      <StatusNote icon={Timer}>
        {m.device_shutdownIn({ seconds: state.autoOffRemaining })}
      </StatusNote>
    </Show>
  );
};
