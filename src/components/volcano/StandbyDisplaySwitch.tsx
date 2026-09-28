import { FaSolidLightbulb } from "solid-icons/fa";
import { useTranslations } from "../../i18n/utils";
import { useVolcano } from "../../provider/VolcanoProvider";
import { Switch } from "../Switch";

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
