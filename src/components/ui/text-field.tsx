import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import * as TextFieldPrimitive from "@kobalte/core/text-field";
import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../../lib/utils";

type TextFieldRootProps<T extends ValidComponent = "div"> =
  TextFieldPrimitive.TextFieldRootProps<T> & { class?: string | undefined };

const TextField = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, TextFieldRootProps<T>>
) => {
  const [local, others] = splitProps(props as TextFieldRootProps, ["class"]);
  return (
    <TextFieldPrimitive.Root
      class={cn("flex flex-col gap-1.5", local.class)}
      {...others}
    />
  );
};

type TextFieldInputProps<T extends ValidComponent = "input"> =
  TextFieldPrimitive.TextFieldInputProps<T> & { class?: string | undefined };

const TextFieldInput = <T extends ValidComponent = "input">(
  props: PolymorphicProps<T, TextFieldInputProps<T>>
) => {
  const [local, others] = splitProps(props as TextFieldInputProps, ["class"]);
  return (
    <TextFieldPrimitive.Input
      class={cn(
        "flex h-10 w-full select-text rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...others}
    />
  );
};

type TextFieldLabelProps<T extends ValidComponent = "label"> =
  TextFieldPrimitive.TextFieldLabelProps<T> & { class?: string | undefined };

const TextFieldLabel = <T extends ValidComponent = "label">(
  props: PolymorphicProps<T, TextFieldLabelProps<T>>
) => {
  const [local, others] = splitProps(props as TextFieldLabelProps, ["class"]);
  return (
    <TextFieldPrimitive.Label
      class={cn("font-medium text-sm", local.class)}
      {...others}
    />
  );
};

export { TextField, TextFieldInput, TextFieldLabel };
