import { useVolcanoDeviceContext } from "../../provider/VolcanoDeviceProvider";
import { BsPhoneVibrate } from "solid-icons/bs";
import { Switch } from "../Switch";
import { useTranslations } from "../../i18n/utils";

export const VibrationSwitch = () => {
  const t = useTranslations();

  const { vibration } = useVolcanoDeviceContext();
  const { isVibrationOn, setVibrationOff, setVibrationOn } = vibration;

  const toggleSwitch = (isOn: boolean) => {
    if (isOn) {
      setVibrationOn();
    } else {
      setVibrationOff();
    }
  };

  return (
    <Switch
      label={t("vibration")}
      onToggle={toggleSwitch}
      isOn={isVibrationOn()}
      icon={<BsPhoneVibrate size="18px" />}
    />
  );
};
