import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import * as SwitchPrimitive from "@kobalte/core/switch";
import type { JSX, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../../lib/utils";

const Switch = SwitchPrimitive.Root;
const SwitchDescription = SwitchPrimitive.Description;

type SwitchControlProps = SwitchPrimitive.SwitchControlProps & {
  class?: string | undefined;
  children?: JSX.Element;
};

const SwitchControl = <T extends ValidComponent = "input">(
  props: PolymorphicProps<T, SwitchControlProps>
) => {
  const [local, others] = splitProps(props as SwitchControlProps, [
    "class",
    "children",
  ]);
  return (
    <>
      <SwitchPrimitive.Input class="peer" />
      <SwitchPrimitive.Control
        class={cn(
          "inline-flex h-[26px] w-11 shrink-0 cursor-pointer items-center rounded-full bg-input p-[3px] transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-ring peer-focus-visible:outline-offset-2 data-[disabled]:cursor-not-allowed data-[checked]:bg-primary data-[disabled]:opacity-50",
          local.class
        )}
        {...others}
      >
        {local.children ?? <SwitchThumb />}
      </SwitchPrimitive.Control>
    </>
  );
};

type SwitchThumbProps = SwitchPrimitive.SwitchThumbProps & {
  class?: string | undefined;
};

const SwitchThumb = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, SwitchThumbProps>
) => {
  const [local, others] = splitProps(props as SwitchThumbProps, ["class"]);
  return (
    <SwitchPrimitive.Thumb
      class={cn(
        "pointer-events-none block size-5 translate-x-0 rounded-full bg-white shadow-sm transition-transform data-[checked]:translate-x-[18px]",
        local.class
      )}
      {...others}
    />
  );
};

type SwitchLabelProps = SwitchPrimitive.SwitchLabelProps & {
  class?: string | undefined;
};

const SwitchLabel = <T extends ValidComponent = "label">(
  props: PolymorphicProps<T, SwitchLabelProps>
) => {
  const [local, others] = splitProps(props as SwitchLabelProps, ["class"]);
  return (
    <SwitchPrimitive.Label
      class={cn(
        "font-medium text-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70",
        local.class
      )}
      {...others}
    />
  );
};

export { Switch, SwitchControl, SwitchDescription, SwitchLabel, SwitchThumb };
