import { useNavigate } from "@solidjs/router";
import Bluetooth from "lucide-solid/icons/bluetooth";
import ChevronDown from "lucide-solid/icons/chevron-down";
import CircleHelp from "lucide-solid/icons/circle-question-mark";
import Copy from "lucide-solid/icons/copy";
import ExternalLink from "lucide-solid/icons/external-link";
import ListIcon from "lucide-solid/icons/list";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import { createEffect, createSignal, For, Match, Show, Switch } from "solid-js";
import { cn } from "../lib/utils";
import { m } from "../paraglide/messages";
import { useBluetooth } from "../provider/BluetoothProvider";
import { buildRoute } from "../routes";
import { ConnectionState, DeviceType } from "../utils/uuids";
import { decodeWorkflow, getPendingWorkflowCode } from "../utils/workflowShare";
import { ThemeToggle } from "./AppHeader";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const TROUBLESHOOTING_URL =
  "https://github.com/firsttris/reactive-volcano-app#-no-devices-found-troubleshooting-with-bluetooth-internals";

// Browsers refuse to open chrome:// URLs from a web page, so we can only
// offer to copy it for pasting into the address bar.
const BLUETOOTH_FLAG_URL = "chrome://flags/#enable-web-bluetooth";

const SUPPORTED_DEVICES = ["Volcano Hybrid", "Venty", "Veazy", "Crafty+"];

const isChromium = () =>
  typeof navigator !== "undefined" && /Chrome\//.test(navigator.userAgent);

const Tips = () => (
  <ul class="list-disc space-y-1.5 pl-4">
    <li>{m.connect_tips_deviceOn()}</li>
    <li>{m.connect_tips_otherConnection()}</li>
    <li>{m.connect_tips_bluetoothEnabled()}</li>
  </ul>
);

const TroubleshootingLink = () => (
  <a
    href={TROUBLESHOOTING_URL}
    target="_blank"
    rel="noopener"
    class="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
  >
    {m.connect_tips_more()}
    <ExternalLink class="size-3.5" />
  </a>
);

/** Bluetooth glyph with rings that ripple while connecting */
const BluetoothBeacon = (props: { active: boolean }) => (
  <div class="relative flex size-[120px] items-center justify-center">
    <span
      class={cn(
        "absolute inset-0 rounded-full border border-primary/25",
        props.active && "motion-safe:animate-ping"
      )}
    />
    <span class="absolute inset-4 rounded-full border border-primary/40" />
    <span class="flex size-16 items-center justify-center rounded-[22px] bg-primary text-primary-foreground shadow-[0_10px_40px_-8px_var(--glow)]">
      <Bluetooth class="size-[30px]" stroke-width={2.25} />
    </span>
  </div>
);

export const Connect = () => {
  const { connect, connectionState, connectionError, deviceInfo } =
    useBluetooth();
  const navigate = useNavigate();

  const isConnecting = () => connectionState() === ConnectionState.CONNECTING;
  const isConnected = () => connectionState() === ConnectionState.CONNECTED;
  const isNotConnected = () => {
    return (
      connectionState() === ConnectionState.NOT_CONNECTED ||
      connectionState() === ConnectionState.CONNECTION_FAILED
    );
  };

  const pendingCode = getPendingWorkflowCode();
  const sharedWorkflowName = pendingCode
    ? decodeWorkflow(pendingCode)?.name
    : undefined;

  const isBluetoothSupported = () =>
    typeof navigator !== "undefined" && "bluetooth" in navigator;

  const [flagUrlCopied, setFlagUrlCopied] = createSignal(false);
  const copyFlagUrl = async () => {
    try {
      await navigator.clipboard.writeText(BLUETOOTH_FLAG_URL);
      setFlagUrlCopied(true);
    } catch (error) {
      console.error("Copying flag URL failed:", error);
    }
  };

  const errorMessage = () => {
    const error = connectionError();
    return error?.kind === "failed" ? error.message : undefined;
  };

  const getDeviceTypeText = () => {
    const device = deviceInfo();
    switch (device.type) {
      case DeviceType.VOLCANO:
        return "Volcano Hybrid";
      case DeviceType.VEAZY:
        return "Veazy";
      case DeviceType.VENTY:
        return "Venty";
      default:
        return "Storz & Bickel Device";
    }
  };

  // Navigate to device-specific route when connected
  createEffect(() => {
    if (isConnected()) {
      const device = deviceInfo();
      switch (device.type) {
        case DeviceType.VOLCANO:
          navigate(buildRoute.volcanoRoot());
          break;
        case DeviceType.VENTY:
        case DeviceType.VEAZY:
          navigate(buildRoute.ventyVeazyRoot());
          break;
        case DeviceType.CRAFTY:
          navigate(buildRoute.craftyRoot());
          break;
        default:
          // Stay on connect page if device type is unknown
          break;
      }
    }
  });

  return (
    <div class="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute top-24 left-1/2 size-[440px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)] opacity-50"
      />
      <div class="relative flex justify-end px-5 pt-[max(1.125rem,env(safe-area-inset-top))]">
        <ThemeToggle />
      </div>

      <main class="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-7 px-6 pt-10 pb-10">
        <BluetoothBeacon active={isConnecting()} />

        <Show when={isNotConnected()}>
          <div class="flex flex-col items-center gap-2.5 text-center">
            <h1 class="font-semibold text-[30px] leading-tight tracking-tight">
              {m.connect_title()}
            </h1>
            <p class="text-[15px] text-muted-foreground leading-relaxed">
              {m.connect_intro()}
            </p>
          </div>

          <div class="flex flex-wrap justify-center gap-2">
            <For each={SUPPORTED_DEVICES}>
              {(device) => (
                <Badge variant="outline" class="h-7 px-3">
                  {device}
                </Badge>
              )}
            </For>
          </div>

          <Show when={sharedWorkflowName}>
            {(name) => (
              <Alert variant="accent">
                <ListIcon />
                <AlertDescription class="text-foreground">
                  {m.connect_pendingWorkflow({ name: name() })}
                </AlertDescription>
              </Alert>
            )}
          </Show>

          <Switch>
            <Match when={!isBluetoothSupported()}>
              <Alert variant="destructive" role="alert">
                <TriangleAlert />
                <AlertTitle>{m.connect_unsupported()}</AlertTitle>
                <AlertDescription>
                  <p>{m.connect_unsupportedHint()}</p>
                  <Show when={isChromium()}>
                    <p>{m.connect_flagHint()}</p>
                    <code class="select-text break-all rounded-md bg-muted px-2 py-1 font-mono text-foreground text-xs">
                      {BLUETOOTH_FLAG_URL}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      class="justify-self-start"
                      onClick={copyFlagUrl}
                    >
                      <Copy />
                      {flagUrlCopied()
                        ? m.common_copied()
                        : m.connect_copyFlagUrl()}
                    </Button>
                  </Show>
                </AlertDescription>
              </Alert>
            </Match>
            <Match when={connectionError()}>
              {(error) => (
                <Alert variant="destructive" role="alert">
                  <TriangleAlert />
                  <AlertTitle>
                    {error().kind === "lost"
                      ? m.connect_lost()
                      : m.connect_failed()}
                  </AlertTitle>
                  <AlertDescription>
                    <Show when={errorMessage()}>
                      <p class="break-words text-xs">{errorMessage()}</p>
                    </Show>
                    <Tips />
                    <TroubleshootingLink />
                  </AlertDescription>
                </Alert>
              )}
            </Match>
          </Switch>

          <Button size="lg" class="w-full" onClick={connect}>
            <Bluetooth />
            {m.connect_button()}
          </Button>

          <Show when={isBluetoothSupported() && !connectionError()}>
            <Collapsible class="w-full rounded-2xl border bg-card">
              <CollapsibleTrigger class="group flex w-full items-center gap-2.5 rounded-2xl px-4 py-3.5 text-left font-medium text-sm">
                <CircleHelp class="size-4 text-muted-foreground" />
                <span class="flex-1">{m.connect_help()}</span>
                <ChevronDown class="size-4 text-muted-foreground transition-transform group-data-[expanded]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent class="grid gap-3 px-4 pb-4 pl-[42px] text-[13px] text-muted-foreground leading-relaxed">
                <Tips />
                <TroubleshootingLink />
              </CollapsibleContent>
            </Collapsible>
          </Show>
        </Show>

        <Show when={isConnecting()}>
          <p class="text-center text-muted-foreground" role="status">
            {m.connect_connectingTo({ device: getDeviceTypeText() })}
          </p>
        </Show>
      </main>
    </div>
  );
};
