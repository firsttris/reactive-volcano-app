import ChevronLeft from "lucide-solid/icons/chevron-left";
import { Show } from "solid-js";
import { m } from "../../../paraglide/messages";
import { Button } from "../../ui/button";

/** Back button with title for the workflow editor pages */
export const EditorHeader = (props: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) => (
  <div class="flex items-center gap-3 pt-2 pb-1">
    <Button
      variant="outline"
      size="icon"
      aria-label={m.common_back()}
      onClick={() => props.onBack()}
    >
      <ChevronLeft />
    </Button>
    <div class="flex min-w-0 flex-col gap-0.5">
      <Show when={props.subtitle}>
        <span class="truncate text-muted-foreground text-xs">
          {props.subtitle}
        </span>
      </Show>
      <h1 class="font-semibold text-xl tracking-tight">{props.title}</h1>
    </div>
  </div>
);
