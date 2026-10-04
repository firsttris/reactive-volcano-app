import MapPin from "lucide-solid/icons/map-pin";
import { type Component, Show } from "solid-js";
import { AnalysisSection } from "../components/AnalysisSection";
import { PageTitle } from "../components/DeviceShell";
import { FactoryReset } from "../components/FactoryReset";
import {
  InfoRow,
  SettingRow,
  SettingSlider,
  SettingSwitch,
  SettingsSection,
} from "../components/Settings";
import { Button } from "../components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { m } from "../paraglide/messages";
import { useVentyVeazy } from "../provider/VentyVeazyProvider";

const formatMinutes = (minutes: number | undefined) =>
  minutes === undefined
    ? "-"
    : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;

export const VentyVeazySettingsView: Component = () => {
  const { state, actions, model } = useVentyVeazy();
  const isVeazy = () => model === "VEAZY";
  const brightness = () => state.brightnessVibration?.brightness ?? 5;

  return (
    <>
      <PageTitle>{m.settings_title()}</PageTitle>

      <SettingsSection title={m.settings_sectionDevice()}>
        <SettingSlider
          label={m.settings_ledBrightness()}
          valueLabel={`${brightness()} / 9`}
          value={brightness()}
          min={1}
          max={9}
          step={1}
          onChange={actions.setBrightness}
        />
        <SettingSwitch
          label={m.settings_vibration()}
          description={m.settings_enableVibration()}
          checked={state.brightnessVibration?.vibration ?? false}
          onChange={actions.setVibration}
        />
        <SettingRow label={m.settings_temperatureUnit()}>
          <ToggleGroup
            aria-label={m.settings_temperatureUnit()}
            value={(state.status?.isCelsius ?? true) ? "C" : "F"}
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
        {/* Permanent Bluetooth - Only Veazy */}
        <Show when={isVeazy()}>
          <SettingSwitch
            label={m.settings_permanentBluetooth()}
            description={m.settings_keepBluetoothAlwaysOn()}
            checked={state.status?.permanentBluetooth ?? false}
            onChange={actions.setPermanentBluetooth}
          />
        </Show>
      </SettingsSection>

      <SettingsSection title={m.heat_boost()}>
        <SettingSwitch
          label={m.settings_boostSuperboostVisualization()}
          description={m.settings_enableBoostLedVisualization()}
          checked={state.status?.boostVisualization ?? false}
          onChange={actions.setBoostVisualization}
        />
        <SettingSwitch
          label={m.settings_permanentBoost()}
          description={m.settings_deactivateBoostTimeout()}
          checked={state.brightnessVibration?.boostTimeoutDisabled ?? false}
          onChange={actions.setBoostTimeoutDisabled}
        />
      </SettingsSection>

      <SettingsSection title={m.settings_sectionCharging()}>
        <SettingSwitch
          label={m.settings_chargeCurrentOptimization()}
          description={m.settings_optimizeChargingCurrent()}
          checked={state.status?.chargeCurrentOptimization ?? false}
          onChange={actions.setChargeCurrentOptimization}
        />
        <SettingSwitch
          label={m.settings_chargeVoltageLimit()}
          description={m.settings_limitChargingVoltage()}
          checked={state.status?.chargeVoltageLimit ?? false}
          onChange={actions.setChargeVoltageLimit}
        />
      </SettingsSection>

      <SettingsSection title={m.device_info()}>
        <InfoRow label={m.device_serialNumber()}>
          {state.deviceData?.serialNumber ?? "-"}
        </InfoRow>
        <InfoRow label={m.device_runtime()}>
          {formatMinutes(state.extendedData?.heaterRuntimeMinutes)}
        </InfoRow>
        <InfoRow label={m.device_batteryChargingTime()}>
          {formatMinutes(state.extendedData?.batteryChargingTimeMinutes)}
        </InfoRow>
        <InfoRow label={m.device_firmware()}>
          {state.firmware?.firmwareVersion ?? "-"}
        </InfoRow>
        <InfoRow label={m.device_bootloader()}>
          {state.firmware?.bootloaderVersion ?? "-"}
        </InfoRow>
      </SettingsSection>

      <SettingsSection title={m.settings_sectionInfo()}>
        {/* Find My Device - only Veazy */}
        <Show when={isVeazy()}>
          <SettingRow label={m.settings_locateDevice()}>
            <Button
              variant="secondary"
              size="sm"
              onClick={actions.triggerFindMyDevice}
            >
              <MapPin />
              {m.settings_findMyDevice()}
            </Button>
          </SettingRow>
        </Show>
        <AnalysisSection run={actions.runAnalysis} />
      </SettingsSection>

      <SettingsSection title={m.settings_sectionDanger()}>
        <FactoryReset onReset={actions.factoryReset} />
      </SettingsSection>
    </>
  );
};
