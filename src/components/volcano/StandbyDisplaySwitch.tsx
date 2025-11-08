import { useVolcanoDeviceContext } from "../../provider/VolcanoDeviceProvider";
import { FaSolidLightbulb } from "solid-icons/fa";
import { Switch } from "../Switch";
import { useTranslations } from "../../i18n/utils";

export const StandbyDisplaySwitch = () => {
  const t = useTranslations();

  const { deviceSetting } = useVolcanoDeviceContext();
  const { isDisplayOnCooling, setDisplayOnCoolingOn, setDisplayOnCoolingOff } =
    deviceSetting;

  const toggleSwitch = (isOn: boolean) => {
    if (isOn) {
      setDisplayOnCoolingOn();
    } else {
      setDisplayOnCoolingOff();
    }
  };

  return (
    <Switch
      label={t("standbyLight")}
      onToggle={toggleSwitch}
      isOn={isDisplayOnCooling()}
      icon={<FaSolidLightbulb size="18px" />}
    />
  );
};
