import Power from "lucide-solid/icons/power";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import { Show } from "solid-js";
import { Limits } from "../../devices/crafty/protocol";
import { m } from "../../paraglide/messages";
import { useCrafty } from "../../provider/CraftyProvider";
import { isPlausibleTemp } from "../../utils/sessionHistory";
import { TemperatureChart } from "../TemperatureChart";
import {
  OffsetStepper,
  TargetStepper,
  ToggleTile,
} from "../TemperatureControls";
import { TemperatureDisplay } from "../TemperatureDisplay";
import { TemperatureGauge } from "../TemperatureGauge";
import { Alert, AlertDescription } from "../ui/alert";

export const Temperature = () => {
  const { state, actions, derived, isOldFirmware } = useCrafty();
  // An "unknown" marker from the device must not show up as a temperature
  const currentTemp = () =>
    isPlausibleTemp(state.currentTemp) ? state.currentTemp : undefined;

  return (
    <>
      <TemperatureGauge
        current={currentTemp()}
        target={state.targetTemp}
        min={Limits.MIN_TEMP}
        max={Limits.MAX_TEMP}
        heating={derived.isHeaterActive()}
        reached={derived.isSetpointReached()}
        minLabel={`${Limits.MIN_TEMP}°`}
        maxLabel={`${Limits.MAX_TEMP}°`}
        targetLabel={`${state.targetTemp} °C`}
      >
        <TemperatureDisplay
          value={currentTemp() ?? state.targetTemp}
          unit="C"
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
        <TemperatureDisplay value={state.targetTemp} unit="C" />
      </TargetStepper>

      <div class="grid grid-cols-2 gap-3">
        <Show
          when={!isOldFirmware}
          fallback={
            <Alert class="rounded-card">
              <TriangleAlert />
              <AlertDescription class="text-xs">
                {m.crafty_oldHeaterUnavailable()}
              </AlertDescription>
            </Alert>
          }
        >
          <ToggleTile
            label={m.heat_heater()}
            status={derived.isHeaterActive() ? m.common_on() : m.common_off()}
            icon={Power}
            pressed={derived.isHeaterActive()}
            onToggle={actions.toggleHeater}
          />
        </Show>
        <OffsetStepper
          label={m.temperature_boostOffset()}
          value={`+${state.boostTemp}°`}
          onDecrease={() => actions.setBoostTemp(state.boostTemp - 1)}
          onIncrease={() => actions.setBoostTemp(state.boostTemp + 1)}
        />
      </div>

      <TemperatureChart
        target={state.targetTemp}
        unit="C"
        toDisplay={(celsius) => celsius}
      />
    </>
  );
};
