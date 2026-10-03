import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { Slider } from "../Slider";

export const AutoShutdownSlider = () => {
  const { state, actions } = useVolcano();

  return (
    <Slider
      value={state.shutoffTime / 60}
      label={`${m.settings_autoShutdownTime()}: ${state.shutoffTime / 60} min`}
      min={1}
      step={1}
      max={10}
      onInput={(minutes) => actions.setShutoffTime(minutes * 60)}
    />
  );
};
