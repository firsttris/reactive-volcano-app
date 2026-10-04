import type { Component } from "solid-js";
import { cn } from "../lib/utils";

interface TemperatureDisplayProps {
  value: number;
  unit: "C" | "F";
  isOffset?: boolean;
  /** Classes for the unit, which is set smaller than the value */
  unitClass?: string;
}

export const TemperatureDisplay: Component<TemperatureDisplayProps> = (
  props
) => {
  return (
    <span class="inline-flex items-baseline tabular-nums">
      {props.isOffset && "+"}
      {props.value}
      <span
        class={cn(
          "ml-1 font-normal text-[0.45em] text-muted-foreground",
          props.unitClass
        )}
      >
        °{props.unit}
      </span>
    </span>
  );
};
