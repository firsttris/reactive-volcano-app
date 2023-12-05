import { createEffect, createSignal } from "solid-js";
import { Slider } from "./Slider";
import { useCharacteristics } from "../../provider/CharacteristicsProvider";
import { useTranslations } from "../../i18n/utils";

export const BrightnessSlider = () => {
  const [getBrightness, setBrightness] = createSignal(0);
  const t = useTranslations();

  const {
    getters: { getBrightness: getBluetoothBrightness },
    setters: { setBrightness: SetBluetoothBrightness },
  } = useCharacteristics();

  createEffect(() => {
    setBrightness(getBluetoothBrightness());
  });

  return (
      <Slider
        value={getBrightness()}
        label={`${t('deviceBrightness')}: ${getBrightness()} %`}
        min={0}
        step={10}
        max={100}
        onInput={(value) => {
          SetBluetoothBrightness(value);
          setBrightness(value);
        }}
      />
  );
};
