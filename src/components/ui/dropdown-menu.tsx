import * as DropdownMenuPrimitive from "@kobalte/core/dropdown-menu";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { Component, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../../lib/utils";

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenu: Component<DropdownMenuPrimitive.DropdownMenuRootProps> = (
  props
) => {
  return <DropdownMenuPrimitive.Root gutter={6} {...props} />;
};

type DropdownMenuContentProps<T extends ValidComponent = "div"> =
  DropdownMenuPrimitive.DropdownMenuContentProps<T> & {
    class?: string | undefined;
  };

const DropdownMenuContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, DropdownMenuContentProps<T>>
) => {
  const [local, others] = splitProps(props as DropdownMenuContentProps, [
    "class",
  ]);
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        class={cn(
          "z-50 min-w-52 origin-[var(--kb-menu-content-transform-origin)] animate-content-hide overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl outline-none data-[expanded]:animate-content-show",
          local.class
        )}
        {...others}
      />
    </DropdownMenuPrimitive.Portal>
  );
};

type DropdownMenuItemProps<T extends ValidComponent = "div"> =
  DropdownMenuPrimitive.DropdownMenuItemProps<T> & {
    class?: string | undefined;
  };

const DropdownMenuItem = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, DropdownMenuItemProps<T>>
) => {
  const [local, others] = splitProps(props as DropdownMenuItemProps, ["class"]);
  return (
    <DropdownMenuPrimitive.Item
      class={cn(
        "relative flex min-h-10 cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        local.class
      )}
      {...others}
    />
  );
};

type DropdownMenuSeparatorProps<T extends ValidComponent = "hr"> =
  DropdownMenuPrimitive.DropdownMenuSeparatorProps<T> & {
    class?: string | undefined;
  };

const DropdownMenuSeparator = <T extends ValidComponent = "hr">(
  props: PolymorphicProps<T, DropdownMenuSeparatorProps<T>>
) => {
  const [local, others] = splitProps(props as DropdownMenuSeparatorProps, [
    "class",
  ]);
  return (
    <DropdownMenuPrimitive.Separator
      class={cn("-mx-1 my-1 h-px border-none bg-border", local.class)}
      {...others}
    />
  );
};

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
