import { Slider } from "./Slider";
import { useCharacteristics } from "../../provider/CharacteristicsProvider";
import { useTranslations } from "../../i18n/utils";

export const BrightnessSlider = () => {
  const t = useTranslations();

  const {
    getters: { getBrightness },
    setters: { setTargetBrightness },
  } = useCharacteristics();

  return (
    <Slider
      value={getBrightness()}
      label={`${t("deviceBrightness")}: ${getBrightness()} %`}
      min={0}
      step={10}
      max={100}
      onInput={(value) => {
        setTargetBrightness(value);
      }}
    />
  );
};
