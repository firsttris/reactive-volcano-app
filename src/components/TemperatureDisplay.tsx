import type { Component } from "solid-js";
import { cn } from "../lib/utils";

interface TemperatureDisplayProps {
  value: number;
  unit: "C" | "F";
  isOffset?: boolean;
  /** Sets the unit raised like an exponent, for large readouts */
  raisedUnit?: boolean;
}

export const TemperatureDisplay: Component<TemperatureDisplayProps> = (
  props
) => {
  return (
    <span
      class={cn(
        "inline-flex tabular-nums",
        props.raisedUnit ? "items-start" : "items-baseline"
      )}
    >
      {props.isOffset && "+"}
      {props.value}
      <span
        class={cn(
          "ml-1 text-muted-foreground tracking-[0.06em]",
          props.raisedUnit
            ? "mt-[0.12em] font-light text-[0.33em]"
            : "font-normal text-[0.45em]"
        )}
      >
        °{props.unit}
      </span>
    </span>
  );
};
