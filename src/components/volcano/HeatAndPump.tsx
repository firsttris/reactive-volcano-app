import Flame from "lucide-solid/icons/flame";
import Wind from "lucide-solid/icons/wind";
import { m } from "../../paraglide/messages";
import { useVolcano } from "../../provider/VolcanoProvider";
import { convertCelsiusToFahrenheit } from "../../utils/bluetoothUtils";
import { ToggleTile } from "../TemperatureControls";

export const HeatAndPump = () => {
  const { state, actions, derived } = useVolcano();

  const targetLabel = () =>
    derived.isCelsius()
      ? `${state.targetTemp} °C`
      : `${convertCelsiusToFahrenheit(state.targetTemp)} °F`;

  return (
    <div class="grid grid-cols-2 gap-3">
      <ToggleTile
        label={m.heat_heater()}
        status={
          derived.isHeating()
            ? m.heat_onTarget({ temperature: targetLabel() })
            : m.common_off()
        }
        icon={Flame}
        pressed={derived.isHeating()}
        onToggle={() =>
          actions
            .setHeater(!derived.isHeating())
            .catch((error) =>
              console.error("Switching the heater failed:", error)
            )
        }
      />
      <ToggleTile
        label={m.heat_pump()}
        status={derived.isPumpActive() ? m.heat_pumpRunning() : m.common_off()}
        icon={Wind}
        pressed={derived.isPumpActive()}
        onToggle={() =>
          actions
            .setPump(!derived.isPumpActive())
            .catch((error) =>
              console.error("Switching the pump failed:", error)
            )
        }
      />
    </div>
  );
};
