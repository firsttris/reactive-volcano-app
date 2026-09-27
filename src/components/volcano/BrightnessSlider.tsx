import { Slider } from "../Slider";
import { useVolcano } from "../../provider/VolcanoProvider";
import { useTranslations } from "../../i18n/utils";

export const BrightnessSlider = () => {
  const t = useTranslations();

  const { state, actions } = useVolcano();

  return (
    <Slider
      value={state.brightness}
      label={`${t("deviceBrightness")}: ${state.brightness} %`}
      min={0}
      step={10}
      max={100}
      onInput={actions.setBrightness}
    />
  );
};
