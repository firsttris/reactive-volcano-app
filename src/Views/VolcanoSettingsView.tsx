import type { Component } from "solid-js";
import { AnalysisSection } from "../components/AnalysisSection";
import { AppSettingsSection } from "../components/AppSettingsSection";
import { PageTitle } from "../components/DeviceShell";
import {
  InfoRow,
  SettingRow,
  SettingSlider,
  SettingSwitch,
  SettingsSection,
} from "../components/Settings";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { m } from "../paraglide/messages";
import { useVolcano } from "../provider/VolcanoProvider";

export const VolcanoSettingsView: Component = () => {
  const { state, actions, derived, info } = useVolcano();

  return (
    <>
      <PageTitle>{m.settings_title()}</PageTitle>

      <SettingsSection title={m.settings_sectionDevice()}>
        <SettingSlider
          label={m.settings_autoShutdownTime()}
          valueLabel={`${state.shutoffTime / 60} min`}
          value={state.shutoffTime / 60}
          min={1}
          max={10}
          step={1}
          onChange={(minutes) => actions.setShutoffTime(minutes * 60)}
        />
        <SettingSlider
          label={m.settings_deviceBrightness()}
          valueLabel={`${state.brightness} %`}
          value={state.brightness}
          min={0}
          max={100}
          step={10}
          onChange={actions.setBrightness}
        />
      </SettingsSection>

      <SettingsSection title={m.settings_sectionBehavior()}>
        <SettingSwitch
          label={m.settings_vibration()}
          checked={derived.isVibrationOn()}
          onChange={actions.setVibration}
        />
        <SettingSwitch
          label={m.settings_standbyLight()}
          checked={derived.isDisplayOnCooling()}
          onChange={actions.setDisplayOnCooling}
        />
        <SettingRow label={m.settings_temperatureUnit()}>
          <ToggleGroup
            aria-label={m.settings_temperatureUnit()}
            value={derived.isCelsius() ? "C" : "F"}
            onChange={(unit) => unit && actions.setIsCelsius(unit === "C")}
          >
            <ToggleGroupItem value="C" aria-label={m.settings_celsius()}>
              °C
            </ToggleGroupItem>
            <ToggleGroupItem value="F" aria-label={m.settings_fahrenheit()}>
              °F
            </ToggleGroupItem>
          </ToggleGroup>
        </SettingRow>
      </SettingsSection>

      <AppSettingsSection />

      <SettingsSection title={m.settings_sectionInfo()}>
        <InfoRow label={m.device_runtime()}>
          {state.heatingHours} h {state.heatingMinutes} min
        </InfoRow>
        <InfoRow label={m.device_serialNumber()}>
          {info.serialNumber || "-"}
        </InfoRow>
        <InfoRow label={m.device_firmware()}>
          {info.firmwareVersion || "-"}
        </InfoRow>
        <AnalysisSection run={actions.runAnalysis} />
      </SettingsSection>
    </>
  );
};
