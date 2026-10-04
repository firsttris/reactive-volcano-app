import { A, useMatch } from "@solidjs/router";
import { type Component, For, type JSX } from "solid-js";
import { cn } from "../lib/utils";
import { AppHeader } from "./AppHeader";

export interface NavTab {
  href: string;
  label: string;
  icon: Component<{ class?: string }>;
  /** Extra route patterns that also highlight this tab */
  alsoActiveOn?: string[];
}

const NavTabLink = (props: { tab: NavTab }) => {
  const matches = [props.tab.href, ...(props.tab.alsoActiveOn ?? [])].map(
    (path) => useMatch(() => path)
  );
  const isActive = () => matches.some((match) => !!match());
  return (
    <A
      href={props.tab.href}
      aria-current={isActive() ? "page" : undefined}
      class={cn(
        "flex flex-col items-center gap-1 rounded-xl py-1.5 font-medium text-[11px] text-muted-foreground transition-colors hover:text-foreground",
        isActive() && "font-semibold text-primary hover:text-primary"
      )}
    >
      <props.tab.icon class="size-[22px]" />
      {props.tab.label}
    </A>
  );
};

interface DeviceShellProps {
  tabs: NavTab[];
  headerTrailing?: JSX.Element;
  children: JSX.Element;
}

/** Page frame of a connected device: header, content and tab bar */
export const DeviceShell = (props: DeviceShellProps) => {
  return (
    <div class="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <AppHeader trailing={props.headerTrailing} />
      <main class="flex flex-1 flex-col gap-4 pt-1">{props.children}</main>
      <nav class="fixed inset-x-0 bottom-0 z-30 border-t bg-nav pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div
          class="mx-auto grid max-w-lg px-3 pt-2 pb-2.5"
          style={{
            "grid-template-columns": `repeat(${props.tabs.length}, minmax(0, 1fr))`,
          }}
        >
          <For each={props.tabs}>{(tab) => <NavTabLink tab={tab} />}</For>
        </div>
      </nav>
    </div>
  );
};

/** Large page title used at the top of secondary tabs */
export const PageTitle = (props: {
  children: JSX.Element;
  actions?: JSX.Element;
}) => (
  <div class="flex items-end justify-between gap-3 pt-2 pb-1">
    <h1 class="font-semibold text-[28px] leading-tight tracking-tight">
      {props.children}
    </h1>
    {props.actions}
  </div>
);
