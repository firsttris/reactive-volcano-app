import * as AlertDialogPrimitive from "@kobalte/core/alert-dialog";
import { useDialogContext } from "@kobalte/core/dialog";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { Component, ComponentProps, JSX, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../../lib/utils";
import { Button, type ButtonProps } from "./button";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
/**
 * Button that closes the dialog. Kobalte's CloseButton would label every
 * such button "Dismiss" for screen readers, hiding "Cancel" or "Reset".
 */
const AlertDialogClose = (
  props: ButtonProps & { onClick?: (event: MouseEvent) => void }
) => {
  const dialog = useDialogContext();
  const [local, others] = splitProps(props, ["onClick"]);
  return (
    <Button
      {...others}
      onClick={(event: MouseEvent) => {
        local.onClick?.(event);
        dialog.close();
      }}
    />
  );
};

type AlertDialogContentProps<T extends ValidComponent = "div"> =
  AlertDialogPrimitive.AlertDialogContentProps<T> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

const AlertDialogContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, AlertDialogContentProps<T>>
) => {
  const [local, others] = splitProps(props as AlertDialogContentProps, [
    "class",
    "children",
  ]);
  return (
    <AlertDialogPortal>
      <AlertDialogPrimitive.Overlay class="data-[closed]:fade-out-0 data-[expanded]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[closed]:animate-out data-[expanded]:animate-in" />
      <div class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <AlertDialogPrimitive.Content
          class={cn(
            "data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 grid w-full max-w-md gap-4 rounded-card border bg-popover p-6 text-popover-foreground shadow-2xl duration-200 data-[closed]:animate-out data-[expanded]:animate-in",
            local.class
          )}
          {...others}
        >
          {local.children}
        </AlertDialogPrimitive.Content>
      </div>
    </AlertDialogPortal>
  );
};

const AlertDialogHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <div class={cn("flex flex-col gap-2", local.class)} {...others} />;
};

const AlertDialogFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        local.class
      )}
      {...others}
    />
  );
};

type AlertDialogTitleProps<T extends ValidComponent = "h2"> =
  AlertDialogPrimitive.AlertDialogTitleProps<T> & {
    class?: string | undefined;
  };

const AlertDialogTitle = <T extends ValidComponent = "h2">(
  props: PolymorphicProps<T, AlertDialogTitleProps<T>>
) => {
  const [local, others] = splitProps(props as AlertDialogTitleProps, ["class"]);
  return (
    <AlertDialogPrimitive.Title
      class={cn("font-semibold text-lg tracking-tight", local.class)}
      {...others}
    />
  );
};

type AlertDialogDescriptionProps<T extends ValidComponent = "p"> =
  AlertDialogPrimitive.AlertDialogDescriptionProps<T> & {
    class?: string | undefined;
  };

const AlertDialogDescription = <T extends ValidComponent = "p">(
  props: PolymorphicProps<T, AlertDialogDescriptionProps<T>>
) => {
  const [local, others] = splitProps(props as AlertDialogDescriptionProps, [
    "class",
  ]);
  return (
    <AlertDialogPrimitive.Description
      class={cn("text-muted-foreground text-sm leading-relaxed", local.class)}
      {...others}
    />
  );
};

export {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
