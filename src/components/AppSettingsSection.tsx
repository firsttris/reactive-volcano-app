import { createSignal, For } from "solid-js";
import { m } from "../paraglide/messages";
import {
  EFFECTS_LEVELS,
  type EffectsLevel,
  useEffects,
} from "../provider/EffectsProvider";
import { useToast } from "../provider/ToastProvider";
import {
  getNotifyPreference,
  getSoundPreference,
  isNotificationSupported,
  setNotifyPreference,
  setSoundPreference,
} from "../utils/notify";
import { SettingSwitch, SettingsSection } from "./Settings";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

const effectsLabels: Record<EffectsLevel, () => string> = {
  off: () => m.settings_effectsOff(),
  subtle: () => m.settings_effectsSubtle(),
  strong: () => m.settings_effectsStrong(),
};

/** Browser-side preferences that apply to every device */
export const AppSettingsSection = () => {
  const showToast = useToast();
  const effects = useEffects();
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
      <div class="flex flex-col gap-2.5 px-4 py-3.5">
        <div class="flex flex-col gap-0.5">
          <span id="effects-label" class="font-medium text-sm">
            {m.settings_effects()}
          </span>
          <span class="text-muted-foreground text-xs">
            {m.settings_effectsHint()}
          </span>
        </div>
        <ToggleGroup
          aria-labelledby="effects-label"
          value={effects.level()}
          onChange={(level) => level && effects.setLevel(level as EffectsLevel)}
        >
          <For each={EFFECTS_LEVELS}>
            {(level) => (
              <ToggleGroupItem value={level}>
                {effectsLabels[level]()}
              </ToggleGroupItem>
            )}
          </For>
        </ToggleGroup>
      </div>
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
