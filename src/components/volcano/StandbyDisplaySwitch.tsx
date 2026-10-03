import { FaSolidLightbulb } from "solid-icons/fa";
import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { Switch } from "../Switch";

export const StandbyDisplaySwitch = () => {
  const { actions, derived } = useVolcano();

  return (
    <Switch
      label={m.settings_standbyLight()}
      onToggle={actions.setDisplayOnCooling}
      isOn={derived.isDisplayOnCooling()}
      icon={<FaSolidLightbulb size="18px" />}
    />
  );
};
