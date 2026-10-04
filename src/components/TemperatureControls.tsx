import Minus from "lucide-solid/icons/minus";
import Plus from "lucide-solid/icons/plus";
import { type Component, type JSX, Show } from "solid-js";
import { cn } from "../lib/utils";
import { m } from "../paraglide/messages";
import { RepeatButton } from "./RepeatButton";
import { Card } from "./ui/card";

interface TargetStepperProps {
  label: string;
  /** The target as shown, in the device's unit */
  children: JSX.Element;
  onIncrease: () => void;
  onDecrease: () => void;
  canIncrease?: boolean;
  canDecrease?: boolean;
}

/** Card with the target temperature between hold-to-repeat −/+ buttons */
export const TargetStepper = (props: TargetStepperProps) => (
  <Card class="flex items-center gap-3 p-3.5">
    <RepeatButton
      onStep={props.onDecrease}
      disabled={props.canDecrease === false}
      aria-label={m.temperature_decrease()}
    >
      <Minus />
    </RepeatButton>
    <div class="flex flex-1 flex-col items-center gap-0.5">
      <span class="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
        {props.label}
      </span>
      <span class="font-medium text-[40px] leading-tight tracking-[-0.03em]">
        {props.children}
      </span>
    </div>
    <RepeatButton
      variant="default"
      onStep={props.onIncrease}
      disabled={props.canIncrease === false}
      aria-label={m.temperature_increase()}
    >
      <Plus />
    </RepeatButton>
  </Card>
);

interface OffsetStepperProps {
  label: string;
  /** The offset as shown, e.g. "+10°" */
  value: string;
  onIncrease: () => void;
  onDecrease: () => void;
  active?: boolean;
}

/** Small card for a boost offset */
export const OffsetStepper = (props: OffsetStepperProps) => (
  <Card
    class={cn(
      "flex flex-col gap-2.5 p-3.5 transition-colors",
      props.active && "border-primary/50 bg-primary-soft"
    )}
  >
    <span class="text-muted-foreground text-xs">{props.label}</span>
    <div class="flex items-center justify-between gap-2">
      <RepeatButton
        size="icon"
        onStep={props.onDecrease}
        aria-label={m.temperature_decreaseOffset({ name: props.label })}
      >
        <Minus />
      </RepeatButton>
      <span class="font-semibold text-lg tabular-nums">{props.value}</span>
      <RepeatButton
        size="icon"
        onStep={props.onIncrease}
        aria-label={m.temperature_increaseOffset({ name: props.label })}
      >
        <Plus />
      </RepeatButton>
    </div>
  </Card>
);

interface ToggleTileProps {
  label: string;
  status: string;
  icon: Component<{ class?: string }>;
  pressed: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/** Large on/off tile for heater and pump */
export const ToggleTile = (props: ToggleTileProps) => (
  <button
    type="button"
    aria-pressed={props.pressed}
    disabled={props.disabled}
    onClick={() => props.onToggle()}
    class={cn(
      "flex touch-manipulation flex-col gap-3.5 rounded-card border bg-card p-4 text-left transition-[background-color,border-color,box-shadow,transform] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:scale-[0.98] disabled:opacity-50",
      props.pressed
        ? "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--primary)] fx:shadow-[0_0_0_1px_var(--primary),0_10px_30px_-12px_var(--glow)] fx-strong:shadow-[0_0_0_1px_var(--primary),0_14px_48px_-10px_var(--glow)]"
        : "hover:bg-accent"
    )}
  >
    <span class="flex w-full items-center justify-between">
      <span
        class={cn(
          "flex size-10 items-center justify-center rounded-xl transition-colors",
          props.pressed
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <props.icon class="size-5" />
      </span>
      <span
        aria-hidden="true"
        class={cn(
          "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
          props.pressed ? "bg-primary" : "bg-input"
        )}
      >
        <span
          class={cn(
            "size-4 rounded-full bg-white transition-transform",
            props.pressed && "translate-x-4"
          )}
        />
      </span>
    </span>
    <span class="flex flex-col gap-0.5">
      <span class="font-semibold text-[15px]">{props.label}</span>
      <span class="text-muted-foreground text-xs">{props.status}</span>
    </span>
  </button>
);

/** Highlighted note at the top of a page, e.g. the shutdown countdown */
export const StatusNote = (props: {
  icon: Component<{ class?: string }>;
  children: JSX.Element;
  trailing?: JSX.Element;
}) => (
  <div
    role="status"
    class="flex items-center gap-2.5 rounded-2xl border border-primary/40 border-dashed bg-primary-soft px-3.5 py-3 text-sm"
  >
    <props.icon class="size-4 shrink-0 text-primary" />
    <span class="flex-1">{props.children}</span>
    <Show when={props.trailing}>
      <span class="font-mono text-muted-foreground text-xs">
        {props.trailing}
      </span>
    </Show>
  </div>
);
