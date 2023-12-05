import { createEffect, createSignal } from "solid-js";
import { Slider } from "./Slider";
import { useCharacteristics } from "../../provider/CharacteristicsProvider";
import { useTranslations } from "../../i18n/utils";

export const AutoShutdownSlider = () => {
  const [getShutOffTimeInMin, setShutOffTimeInMin] = createSignal(1);
  const t = useTranslations();

  const { getters: { getShutoffTimeInSec }, setters: { setShutOffTime: setShutOffTimeInSecBluetooth }} = useCharacteristics();

  createEffect(() => {
    setShutOffTimeInMin(getShutoffTimeInSec()/60)
  });

  return (
    <Slider 
      value={getShutOffTimeInMin()}
      label={`${t('autoMaticShutdownTime')}: ${getShutOffTimeInMin()} min`}
      min={1}
      step={1}
      max={10}
      onInput={(value) => {
        const valueInSec = value*60;
        setShutOffTimeInSecBluetooth(valueInSec)
        setShutOffTimeInMin(value)
      }} 
    />
  );
}