import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import * as SliderPrimitive from "@kobalte/core/slider";
import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../../lib/utils";

type SliderRootProps<T extends ValidComponent = "div"> =
  SliderPrimitive.SliderRootProps<T> & { class?: string | undefined };

const Slider = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, SliderRootProps<T>>
) => {
  const [local, others] = splitProps(props as SliderRootProps, ["class"]);
  return (
    <SliderPrimitive.Root
      class={cn(
        "relative flex w-full touch-none select-none flex-col items-center",
        local.class
      )}
      {...others}
    />
  );
};

type SliderTrackProps<T extends ValidComponent = "div"> =
  SliderPrimitive.SliderTrackProps<T> & { class?: string | undefined };

/** Track with fill and thumb, sized for touch */
const SliderTrack = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, SliderTrackProps<T>>
) => {
  const [local, others] = splitProps(props as SliderTrackProps, ["class"]);
  return (
    <SliderPrimitive.Track
      class={cn(
        "relative h-1.5 w-full grow cursor-pointer rounded-full bg-track",
        local.class
      )}
      {...others}
    >
      <SliderPrimitive.Fill class="absolute h-full rounded-full bg-primary" />
      <SliderPrimitive.Thumb class="-top-[7px] block size-5 rounded-full border-2 border-primary bg-white shadow-[0_0_0_5px_var(--primary-soft)] transition-shadow focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2">
        <SliderPrimitive.Input />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Track>
  );
};

const SliderLabel = SliderPrimitive.Label;
const SliderValueLabel = SliderPrimitive.ValueLabel;

export { Slider, SliderLabel, SliderTrack, SliderValueLabel };
