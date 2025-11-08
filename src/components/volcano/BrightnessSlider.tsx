import { Slider } from "../Slider";
import { useVolcanoDeviceContext } from "../../provider/VolcanoDeviceProvider";
import { useTranslations } from "../../i18n/utils";

export const BrightnessSlider = () => {
  const t = useTranslations();

  const { brightness } = useVolcanoDeviceContext();
  const { getBrightness, setTargetBrightness } = brightness;

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
