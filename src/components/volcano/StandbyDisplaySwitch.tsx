import { useVolcano } from "../../provider/VolcanoProvider";
import { FaSolidLightbulb } from "solid-icons/fa";
import { Switch } from "../Switch";
import { useTranslations } from "../../i18n/utils";

export const StandbyDisplaySwitch = () => {
  const t = useTranslations();

  const { actions, derived } = useVolcano();

  return (
    <Switch
      label={t("standbyLight")}
      onToggle={actions.setDisplayOnCooling}
      isOn={derived.isDisplayOnCooling()}
      icon={<FaSolidLightbulb size="18px" />}
    />
  );
};
