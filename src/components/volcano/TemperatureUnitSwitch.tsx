import { WiCelsius } from "solid-icons/wi";
import { useTranslations } from "../../i18n/utils";
import { useVolcano } from "../../provider/VolcanoProvider";
import { Switch } from "../Switch";

export const TemperatureUnitSwitch = () => {
  const t = useTranslations();

  const { actions, derived } = useVolcano();

  return (
    <Switch
      label={derived.isCelsius() ? t("celsius") : t("fahrenheit")}
      onToggle={actions.setIsCelsius}
      isOn={derived.isCelsius()}
      icon={<WiCelsius size="22px" />}
    />
  );
};
