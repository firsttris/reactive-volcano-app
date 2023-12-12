import { Slider } from "./Slider";
import { useCharacteristics } from "../../provider/CharacteristicsProvider";
import { useTranslations } from "../../i18n/utils";

export const AutoShutdownSlider = () => {
  const t = useTranslations();

  const { getters: { getShutoffTimeInSec }, setters: { setShutOffTime }} = useCharacteristics();

  return (
    <Slider 
      value={getShutoffTimeInSec()/60}
      label={`${t('autoMaticShutdownTime')}: ${getShutoffTimeInSec()/60} min`}
      min={1}
      step={1}
      max={10}
      onInput={(value) => {
        const valueInSec = value*60;
        setShutOffTime(valueInSec)
      }} 
    />
  );
}