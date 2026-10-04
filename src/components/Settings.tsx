import { type JSX, Show } from "solid-js";
import { cn } from "../lib/utils";
import { Card } from "./ui/card";
import { Slider, SliderLabel, SliderTrack } from "./ui/slider";
import {
  Switch,
  SwitchControl,
  SwitchDescription,
  SwitchLabel,
} from "./ui/switch";

/** Titled group of settings in one card */
export const SettingsSection = (props: {
  title: string;
  children: JSX.Element;
  class?: string;
}) => (
  <section class="flex flex-col gap-2">
    <h2 class="mx-1 font-medium text-muted-foreground text-xs uppercase tracking-[0.08em]">
      {props.title}
    </h2>
    <Card class={cn("flex flex-col divide-y overflow-hidden", props.class)}>
      {props.children}
    </Card>
  </section>
);

export const SettingSwitch = (props: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <Switch
    class="flex items-center gap-3 px-4 py-3.5"
    checked={props.checked}
    onChange={props.onChange}
    disabled={props.disabled}
  >
    <div class="flex flex-1 flex-col gap-0.5">
      <SwitchLabel class="cursor-pointer">{props.label}</SwitchLabel>
      <Show when={props.description}>
        <SwitchDescription class="text-muted-foreground text-xs">
          {props.description}
        </SwitchDescription>
      </Show>
    </div>
    <SwitchControl />
  </Switch>
);

export const SettingSlider = (props: {
  label: string;
  /** Formatted current value, e.g. "4 min" */
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => (
  <Slider
    class="gap-4 px-4 pt-4 pb-5"
    value={[props.value]}
    minValue={props.min}
    maxValue={props.max}
    step={props.step}
    onChange={(values) => props.onChange(values[0])}
    getValueLabel={() => props.valueLabel}
  >
    <div class="flex w-full items-center justify-between gap-3">
      <SliderLabel class="font-medium text-sm">{props.label}</SliderLabel>
      <span class="rounded-md bg-muted px-2 py-0.5 font-mono text-xs tabular-nums">
        {props.valueLabel}
      </span>
    </div>
    <SliderTrack />
  </Slider>
);

export const SettingRow = (props: {
  label: string;
  description?: string;
  children: JSX.Element;
}) => (
  <div class="flex items-center gap-3 px-4 py-3.5">
    <div class="flex flex-1 flex-col gap-0.5">
      <span class="font-medium text-sm">{props.label}</span>
      <Show when={props.description}>
        <span class="text-muted-foreground text-xs">{props.description}</span>
      </Show>
    </div>
    {props.children}
  </div>
);

export const InfoRow = (props: { label: string; children: JSX.Element }) => (
  <div class="flex items-center justify-between gap-4 px-4 py-3.5 text-sm">
    <span class="text-muted-foreground">{props.label}</span>
    <span class="select-text text-right font-mono text-[13px] tabular-nums">
      {props.children}
    </span>
  </div>
);
