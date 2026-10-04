import Zap from "lucide-solid/icons/zap";
import { Show } from "solid-js";
import { cn } from "../lib/utils";
import { m } from "../paraglide/messages";

/** Battery level for the header, with a bolt while charging */
export const BatteryChip = (props: {
  /** Percent; nothing is shown until the device reported it */
  level: number | undefined;
  charging?: boolean;
}) => {
  const fillColor = () => {
    const level = props.level ?? 0;
    if (level > 50) return "bg-success";
    if (level > 20) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <Show when={props.level !== undefined}>
      <div
        role="img"
        aria-label={`${m.device_battery()}: ${props.level} %${props.charging ? `, ${m.device_isCharging()}` : ""}`}
        class={cn(
          "flex h-8 shrink-0 items-center gap-2 rounded-lg border bg-card px-2.5 font-medium text-[13px] tabular-nums",
          props.charging && "border-primary/40 bg-primary-soft"
        )}
      >
        <Show
          when={props.charging}
          fallback={
            <span class="relative h-[11px] w-[22px] rounded-[3px] border-[1.5px] border-muted-foreground p-px">
              <span
                class={cn("block h-full rounded-[1px]", fillColor())}
                style={{
                  width: `${Math.max(0, Math.min(100, props.level ?? 0))}%`,
                }}
              />
            </span>
          }
        >
          <Zap class="size-3.5 fill-primary text-primary" />
        </Show>
        {props.level} %
      </div>
    </Show>
  );
};
