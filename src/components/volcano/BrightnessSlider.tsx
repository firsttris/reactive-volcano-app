import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { Slider } from "../Slider";

export const BrightnessSlider = () => {
  const { state, actions } = useVolcano();

  return (
    <Slider
      value={state.brightness}
      label={`${m.settings_deviceBrightness()}: ${state.brightness} %`}
      min={0}
      step={10}
      max={100}
      onInput={actions.setBrightness}
    />
  );
};
