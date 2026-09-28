import { VsColorMode } from "solid-icons/vs";
import "./DarkModeSwitch.css";
import { useTranslations } from "../i18n/utils";
import { useDarkMode } from "../provider/DarkModeProvider";
import { Switch } from "./Switch";

export const DarkModeSwitch = () => {
  const { toggleDarkMode, isDarkMode } = useDarkMode();
  const t = useTranslations();

  return (
    <Switch
      label={t("darkMode")}
      onToggle={toggleDarkMode}
      isOn={isDarkMode()}
      icon={<VsColorMode size="18px" />}
    />
  );
};
