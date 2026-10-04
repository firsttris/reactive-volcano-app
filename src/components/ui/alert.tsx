import * as AlertPrimitive from "@kobalte/core/alert";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { Component, ComponentProps, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../../lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-2xl border px-4 py-3.5 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground [&>svg]:text-muted-foreground",
        accent:
          "border-primary/40 bg-primary-soft text-foreground [&>svg]:text-primary",
        destructive:
          "border-destructive/40 bg-destructive/10 text-foreground [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type AlertRootProps<T extends ValidComponent = "div"> =
  AlertPrimitive.AlertRootProps<T> &
    VariantProps<typeof alertVariants> & { class?: string | undefined };

const Alert = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, AlertRootProps<T>>
) => {
  const [local, others] = splitProps(props as AlertRootProps, [
    "class",
    "variant",
  ]);
  return (
    <AlertPrimitive.Root
      class={cn(alertVariants({ variant: local.variant }), local.class)}
      {...others}
    />
  );
};

const AlertTitle: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("col-start-2 font-semibold leading-snug", local.class)}
      {...others}
    />
  );
};

const AlertDescription: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn(
        "col-start-2 grid gap-2 text-muted-foreground leading-relaxed",
        local.class
      )}
      {...others}
    />
  );
};

export { Alert, AlertDescription, AlertTitle };
