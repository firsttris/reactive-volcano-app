import { BsPhoneVibrate } from "solid-icons/bs";
import { useTranslations } from "../../i18n/utils";
import { useVolcano } from "../../provider/VolcanoProvider";
import { Switch } from "../Switch";

export const VibrationSwitch = () => {
  const t = useTranslations();

  const { actions, derived } = useVolcano();

  return (
    <Switch
      label={t("vibration")}
      onToggle={actions.setVibration}
      isOn={derived.isVibrationOn()}
      icon={<BsPhoneVibrate size="18px" />}
    />
  );
};
