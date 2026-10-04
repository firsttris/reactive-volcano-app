import type { Component } from "solid-js";
import { TemperatureChart } from "../components/TemperatureChart";
import { HeatAndPump } from "../components/volcano/HeatAndPump";
import { ShutdownTime } from "../components/volcano/ShutdownTime";
import { Temperature } from "../components/volcano/Temperature";
import { useVolcano } from "../provider/VolcanoProvider";
import { convertCelsiusToFahrenheit } from "../utils/bluetoothUtils";

export const VolcanoView: Component = () => {
  const { state, derived } = useVolcano();
  return (
    <>
      <ShutdownTime />
      <Temperature />
      <HeatAndPump />
      <TemperatureChart
        target={state.targetTemp}
        unit={derived.isCelsius() ? "C" : "F"}
        toDisplay={(celsius) =>
          derived.isCelsius() ? celsius : convertCelsiusToFahrenheit(celsius)
        }
      />
    </>
  );
};
