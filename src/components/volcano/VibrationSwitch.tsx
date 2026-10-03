import { BsPhoneVibrate } from "solid-icons/bs";
import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { Switch } from "../Switch";

export const VibrationSwitch = () => {
  const { actions, derived } = useVolcano();

  return (
    <Switch
      label={m.settings_vibration()}
      onToggle={actions.setVibration}
      isOn={derived.isVibrationOn()}
      icon={<BsPhoneVibrate size="18px" />}
    />
  );
};
