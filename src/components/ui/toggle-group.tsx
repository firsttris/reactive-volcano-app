import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import * as ToggleGroupPrimitive from "@kobalte/core/toggle-group";
import type { JSX, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../../lib/utils";

type ToggleGroupRootProps<T extends ValidComponent = "div"> =
  ToggleGroupPrimitive.ToggleGroupRootProps<T> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

/** Segmented control: one pill per option on a muted track */
const ToggleGroup = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, ToggleGroupRootProps<T>>
) => {
  const [local, others] = splitProps(props as ToggleGroupRootProps, ["class"]);
  return (
    <ToggleGroupPrimitive.Root
      class={cn("flex items-center gap-1 rounded-xl bg-muted p-1", local.class)}
      {...others}
    />
  );
};

type ToggleGroupItemProps<T extends ValidComponent = "button"> =
  ToggleGroupPrimitive.ToggleGroupItemProps<T> & {
    class?: string | undefined;
  };

const ToggleGroupItem = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, ToggleGroupItemProps<T>>
) => {
  const [local, others] = splitProps(props as ToggleGroupItemProps, ["class"]);
  return (
    <ToggleGroupPrimitive.Item
      class={cn(
        "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-foreground data-[pressed]:font-semibold data-[pressed]:text-background",
        local.class
      )}
      {...others}
    />
  );
};

export { ToggleGroup, ToggleGroupItem };
