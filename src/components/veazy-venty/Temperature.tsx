import { For, Show } from "solid-js";
import {
  HeaterMode,
  Limits,
  toDisplayTemperature,
} from "../../devices/ventyVeazy/protocol";
import { useWakeLock } from "../../hooks/utils/useWakeLock";
import { m } from "../../paraglide/messages";
import { useVentyVeazy } from "../../provider/VentyVeazyProvider";
import { OffsetStepper, TargetStepper } from "../TemperatureControls";
import { TemperatureDisplay } from "../TemperatureDisplay";
import { TemperatureGauge } from "../TemperatureGauge";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

export const Temperature = () => {
  const { state, actions, display } = useVentyVeazy();
  const isCelsius = () => state.status?.isCelsius ?? true;
  const unit = () => (isCelsius() ? "C" : "F");
  const heaterMode = () => state.status?.heaterMode ?? HeaterMode.OFF;
  const isHeating = () => heaterMode() !== HeaterMode.OFF;

  // Keep the screen on while the device heats
  useWakeLock(isHeating);

  /** The temperature the device heats to, in °C, including boost */
  const effectiveCelsius = () => {
    const status = state.status;
    if (!status) return 0;
    if (status.heaterMode === HeaterMode.BOOST) {
      return status.targetTemp + status.boostTemp;
    }
    if (status.heaterMode === HeaterMode.SUPERBOOST) {
      return status.targetTemp + status.superBoostTemp;
    }
    return status.targetTemp;
  };

  // All adjustments are in °C; the store clamps to the device limits
  const adjustTemperature = (change: number) => {
    if (!state.status) return;
    actions.setTargetTemp(state.status.targetTemp + change);
  };

  const adjustBoostTemp = (change: number) => {
    if (!state.status) return;
    actions.setBoostTemp(state.status.boostTemp + change);
  };

  const adjustSuperBoostTemp = (change: number) => {
    if (!state.status) return;
    actions.setSuperBoostTemp(state.status.superBoostTemp + change);
  };

  const modes = () => [
    { value: HeaterMode.OFF, label: m.common_off(), detail: "" },
    {
      value: HeaterMode.NORMAL,
      label: m.heat_normal(),
      detail: `${display.targetTemp()}°`,
    },
    {
      value: HeaterMode.BOOST,
      label: m.heat_boost(),
      detail: `+${display.boostTemp()}°`,
    },
    {
      value: HeaterMode.SUPERBOOST,
      label: m.heat_superboost(),
      detail: `+${display.superBoostTemp()}°`,
    },
  ];

  return (
    <>
      {/* The Venty/Veazy reports no current temperature (0x8000), like the
          official app the gauge shows the effective target and its status */}
      <TemperatureGauge
        target={effectiveCelsius()}
        min={Limits.MIN_TEMP}
        max={Limits.MAX_TEMP}
        heating={isHeating()}
        reached={isHeating() && (state.status?.setpointReached ?? false)}
        minLabel={`${toDisplayTemperature(Limits.MIN_TEMP, isCelsius())}°`}
        maxLabel={`${toDisplayTemperature(Limits.MAX_TEMP, isCelsius())}°`}
        targetLabel={`${display.effectiveTemp()} °${unit()}`}
      >
        <TemperatureDisplay
          value={display.effectiveTemp()}
          unit={unit()}
          raisedUnit
        />
      </TemperatureGauge>

      <section class="flex flex-col gap-2">
        <div class="mx-1 flex items-baseline justify-between text-xs">
          <h2 class="font-medium text-muted-foreground uppercase tracking-[0.08em]">
            {m.heat_mode()}
          </h2>
          <Show when={isHeating()}>
            <span class="text-muted-foreground">
              {m.temperature_effective()}{" "}
              <span class="font-semibold text-foreground tabular-nums">
                {display.effectiveTemp()} °{unit()}
              </span>
            </span>
          </Show>
        </div>
        <ToggleGroup
          aria-label={m.heat_mode()}
          class="rounded-2xl border bg-card"
          value={String(heaterMode())}
          onChange={(value) => value && actions.setHeaterMode(Number(value))}
        >
          <For each={modes()}>
            {(mode) => (
              <ToggleGroupItem
                value={String(mode.value)}
                class="h-[52px] flex-col gap-0.5 rounded-xl px-1 data-[pressed]:bg-primary data-[pressed]:text-primary-foreground fx:data-[pressed]:shadow-[0_8px_20px_-8px_var(--glow)] fx-strong:data-[pressed]:shadow-[0_10px_32px_-8px_var(--glow)]"
              >
                <span class="text-[13px] leading-none">{mode.label}</span>
                <Show when={mode.detail}>
                  <span class="font-mono font-normal text-[11px] leading-none opacity-80">
                    {mode.detail}
                  </span>
                </Show>
              </ToggleGroupItem>
            )}
          </For>
        </ToggleGroup>
      </section>

      <TargetStepper
        label={m.temperature_base()}
        onDecrease={() => adjustTemperature(-1)}
        onIncrease={() => adjustTemperature(1)}
      >
        <TemperatureDisplay value={display.targetTemp()} unit={unit()} />
      </TargetStepper>

      <div class="grid grid-cols-2 gap-3">
        <OffsetStepper
          label={m.temperature_boostOffset()}
          value={`+${display.boostTemp()}°`}
          active={heaterMode() === HeaterMode.BOOST}
          onDecrease={() => adjustBoostTemp(-1)}
          onIncrease={() => adjustBoostTemp(1)}
        />
        <OffsetStepper
          label={m.temperature_superBoostOffset()}
          value={`+${display.superBoostTemp()}°`}
          active={heaterMode() === HeaterMode.SUPERBOOST}
          onDecrease={() => adjustSuperBoostTemp(-1)}
          onIncrease={() => adjustSuperBoostTemp(1)}
        />
      </div>
    </>
  );
};
