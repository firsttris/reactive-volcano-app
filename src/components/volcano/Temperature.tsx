import { For } from "solid-js";
import { Limits } from "../../devices/volcano/protocol";
import { cn } from "../../lib/utils";
import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { convertCelsiusToFahrenheit } from "../../utils/bluetoothUtils";
import { TargetStepper } from "../TemperatureControls";
import { TemperatureDisplay } from "../TemperatureDisplay";
import { TemperatureGauge } from "../TemperatureGauge";

/** Common targets in °C, one tap away */
const PRESETS = [170, 185, 195, 210];

export const Temperature = () => {
  const { state, actions, derived } = useVolcano();
  const isCelsius = derived.isCelsius;
  const unit = () => (isCelsius() ? "C" : "F");

  // The Volcano always reports °C, so convert for display in Fahrenheit mode
  const toDisplayUnit = (celsius: number) =>
    isCelsius() ? celsius : convertCelsiusToFahrenheit(celsius);

  return (
    <>
      <TemperatureGauge
        current={state.currentTemp}
        target={state.targetTemp}
        min={Limits.MIN_TEMP}
        max={Limits.MAX_TEMP}
        heating={derived.isHeating()}
        minLabel={`${toDisplayUnit(Limits.MIN_TEMP)}°`}
        maxLabel={`${toDisplayUnit(Limits.MAX_TEMP)}°`}
        targetLabel={`${toDisplayUnit(state.targetTemp)} °${unit()}`}
      >
        <TemperatureDisplay
          value={toDisplayUnit(state.currentTemp)}
          unit={unit()}
          raisedUnit
        />
      </TemperatureGauge>

      <TargetStepper
        label={m.temperature_target()}
        onDecrease={() => actions.setTargetTemp(state.targetTemp - 1)}
        onIncrease={() => actions.setTargetTemp(state.targetTemp + 1)}
        canDecrease={state.targetTemp > Limits.MIN_TEMP}
        canIncrease={state.targetTemp < Limits.MAX_TEMP}
      >
        <TemperatureDisplay
          value={toDisplayUnit(state.targetTemp)}
          unit={unit()}
        />
      </TargetStepper>

      <fieldset class="grid grid-cols-4 gap-2">
        <legend class="sr-only">{m.temperature_presets()}</legend>
        <For each={PRESETS}>
          {(celsius) => (
            <button
              type="button"
              aria-pressed={state.targetTemp === celsius}
              onClick={() => actions.setTargetTemp(celsius)}
              class={cn(
                "h-9 rounded-[10px] border font-medium text-[13px] text-muted-foreground tabular-nums transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                state.targetTemp === celsius &&
                  "border-primary/50 bg-primary-soft text-foreground"
              )}
            >
              {toDisplayUnit(celsius)}°
            </button>
          )}
        </For>
      </fieldset>
    </>
  );
};
