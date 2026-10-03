import { WiCelsius } from "solid-icons/wi";
import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { Switch } from "../Switch";

export const TemperatureUnitSwitch = () => {
  const { actions, derived } = useVolcano();

  return (
    <Switch
      label={
        derived.isCelsius() ? m.settings_celsius() : m.settings_fahrenheit()
      }
      onToggle={actions.setIsCelsius}
      isOn={derived.isCelsius()}
      icon={<WiCelsius size="22px" />}
    />
  );
};
