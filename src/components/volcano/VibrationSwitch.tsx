import { useVolcano } from "../../provider/VolcanoProvider";
import { BsPhoneVibrate } from "solid-icons/bs";
import { Switch } from "../Switch";
import { useTranslations } from "../../i18n/utils";

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
