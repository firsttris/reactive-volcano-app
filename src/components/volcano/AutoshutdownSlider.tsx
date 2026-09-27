import { Slider } from "../Slider";
import { useVolcano } from "../../provider/VolcanoProvider";
import { useTranslations } from "../../i18n/utils";

export const AutoShutdownSlider = () => {
  const t = useTranslations();

  const { state, actions } = useVolcano();

  return (
    <Slider
      value={state.shutoffTime / 60}
      label={`${t("autoMaticShutdownTime")}: ${state.shutoffTime / 60} min`}
      min={1}
      step={1}
      max={10}
      onInput={(minutes) => actions.setShutoffTime(minutes * 60)}
    />
  );
};
