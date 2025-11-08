import { Slider } from "../Slider";
import { useVolcanoDeviceContext } from "../../provider/VolcanoDeviceProvider";
import { useTranslations } from "../../i18n/utils";

export const AutoShutdownSlider = () => {
  const t = useTranslations();

  const { shutdowntime } = useVolcanoDeviceContext();
  const { getShutoffTimeInSec, setShutOffTime } = shutdowntime;

  return (
    <Slider
      value={getShutoffTimeInSec() / 60}
      label={`${t("autoMaticShutdownTime")}: ${getShutoffTimeInSec() / 60} min`}
      min={1}
      step={1}
      max={10}
      onInput={(value) => {
        const valueInSec = value * 60;
        setShutOffTime(valueInSec);
      }}
    />
  );
};
