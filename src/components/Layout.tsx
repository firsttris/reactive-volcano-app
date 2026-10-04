import type { RouteSectionProps } from "@solidjs/router";

export const Layout = (props: RouteSectionProps) => {
  return <div class="min-h-dvh">{props.children}</div>;
};
