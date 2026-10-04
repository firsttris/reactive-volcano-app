import TriangleAlert from "lucide-solid/icons/triangle-alert";
import { type Component, Show } from "solid-js";
import { AnalysisSection } from "../components/AnalysisSection";
import { PageTitle } from "../components/DeviceShell";
import { FactoryReset } from "../components/FactoryReset";
import {
  InfoRow,
  SettingSlider,
  SettingSwitch,
  SettingsSection,
} from "../components/Settings";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Limits } from "../devices/crafty/protocol";
import { m } from "../paraglide/messages";
import { useCrafty } from "../provider/CraftyProvider";

const formatCountdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

export const CraftySettingsView: Component = () => {
  const { state, actions, derived, firmwareVersion, isOldFirmware } =
    useCrafty();

  return (
    <>
      <PageTitle>{m.settings_title()}</PageTitle>

      <Show when={isOldFirmware}>
        <Alert variant="accent">
          <TriangleAlert />
          <AlertDescription>
            Old Crafty detected. Some features are not available.
          </AlertDescription>
        </Alert>
      </Show>

      <SettingsSection title={m.settings_sectionDevice()}>
        <SettingSlider
          label={m.settings_deviceBrightness()}
          valueLabel={`${state.ledBrightness} %`}
          value={state.ledBrightness}
          min={Limits.MIN_BRIGHTNESS}
          max={Limits.MAX_BRIGHTNESS}
          step={10}
          onChange={actions.setLedBrightness}
        />
        {/* Auto shutdown - only on Crafty+ */}
        <Show when={!isOldFirmware}>
          <SettingSlider
            label={m.settings_autoShutdownTime()}
            valueLabel={
              state.autoOffCountdown === null
                ? "-"
                : formatCountdown(state.autoOffCountdown)
            }
            value={state.autoOffCountdown ?? Limits.MIN_AUTO_OFF}
            min={Limits.MIN_AUTO_OFF}
            max={Limits.MAX_AUTO_OFF}
            step={30}
            onChange={actions.setAutoOffCountdown}
          />
        </Show>
      </SettingsSection>

      <SettingsSection title={m.settings_sectionBehavior()}>
        <SettingSwitch
          label={m.settings_vibration()}
          description={m.settings_enableVibration()}
          checked={derived.isVibrationOn()}
          onChange={actions.setVibration}
        />
        <SettingSwitch
          label={m.settings_chargeIndicatorLamp()}
          description={m.settings_enableChargeLed()}
          checked={derived.isChargeLedOn()}
          onChange={actions.setChargeLed}
        />
        {/* Permanent Bluetooth - not on old firmware */}
        <Show when={!isOldFirmware}>
          <SettingSwitch
            label={m.settings_permanentBluetooth()}
            description={m.settings_keepBluetoothAlwaysOn()}
            checked={derived.isPermanentBluetooth()}
            onChange={actions.setPermanentBluetooth}
          />
        </Show>
      </SettingsSection>

      <SettingsSection title={m.device_info()}>
        <InfoRow label={m.device_battery()}>{state.batteryLevel} %</InfoRow>
        <InfoRow label="Usage Time">
          {state.useHours} h{!isOldFirmware && ` ${state.useMinutes ?? 0} min`}
        </InfoRow>
        <Show when={!isOldFirmware}>
          <InfoRow label="Current Auto-Off Time">
            {formatCountdown(state.autoOffRemaining ?? 0)} min
          </InfoRow>
        </Show>
        <InfoRow label={m.device_firmware()}>{firmwareVersion}</InfoRow>
        <Show when={!isOldFirmware}>
          <InfoRow label="BLE Firmware Version">
            {state.bleFirmwareVersion ?? "-"}
          </InfoRow>
        </Show>
        <InfoRow label="Status Register 2">{state.statusRegister2}</InfoRow>
        {/* System status - only on Crafty+ */}
        <Show when={!isOldFirmware}>
          <InfoRow label="System Status">{state.systemStatus ?? "-"}</InfoRow>
          <InfoRow label="Akku Status 1">{state.akkuStatus ?? "-"}</InfoRow>
          <InfoRow label="Akku Status 2">{state.akkuStatus2 ?? "-"}</InfoRow>
        </Show>
      </SettingsSection>

      {/* Analysis and factory reset - not on old firmware */}
      <Show when={!isOldFirmware}>
        <SettingsSection title={m.settings_sectionInfo()}>
          <AnalysisSection run={actions.runAnalysis} />
        </SettingsSection>
        <SettingsSection title={m.settings_sectionDanger()}>
          <FactoryReset onReset={actions.factoryReset} />
        </SettingsSection>
      </Show>
    </>
  );
};
