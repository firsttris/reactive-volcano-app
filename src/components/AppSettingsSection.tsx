import { createSignal } from "solid-js";
import { m } from "../paraglide/messages";
import { useToast } from "../provider/ToastProvider";
import {
  getNotifyPreference,
  getSoundPreference,
  isNotificationSupported,
  setNotifyPreference,
  setSoundPreference,
} from "../utils/notify";
import { SettingSwitch, SettingsSection } from "./Settings";

/** Browser-side preferences that apply to every device */
export const AppSettingsSection = () => {
  const showToast = useToast();
  const [notify, setNotify] = createSignal(getNotifyPreference());
  const [sound, setSound] = createSignal(getSoundPreference());

  const toggleNotify = async (enabled: boolean) => {
    const effective = await setNotifyPreference(enabled);
    setNotify(effective);
    if (enabled && !effective) {
      showToast({ message: m.settings_notifyBlocked() });
    }
  };

  return (
    <SettingsSection title={m.settings_sectionApp()}>
      <SettingSwitch
        label={m.settings_notifyReached()}
        description={
          isNotificationSupported()
            ? m.settings_notifyReachedHint()
            : m.settings_notifyUnsupported()
        }
        checked={notify()}
        disabled={!isNotificationSupported()}
        onChange={toggleNotify}
      />
      <SettingSwitch
        label={m.settings_sound()}
        description={m.settings_soundHint()}
        checked={sound()}
        onChange={(enabled) => {
          setSoundPreference(enabled);
          setSound(enabled);
        }}
      />
    </SettingsSection>
  );
};
