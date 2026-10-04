import Bluetooth from "lucide-solid/icons/bluetooth";
import BluetoothOff from "lucide-solid/icons/bluetooth-off";
import LoaderCircle from "lucide-solid/icons/loader-circle";
import Moon from "lucide-solid/icons/moon";
import Power from "lucide-solid/icons/power";
import Sun from "lucide-solid/icons/sun";
import { type JSX, Match, Show, Switch } from "solid-js";
import { m } from "../paraglide/messages";
import { useBluetooth } from "../provider/BluetoothProvider";
import { useDarkMode } from "../provider/DarkModeProvider";
import { ConnectionState, DeviceType } from "../utils/uuids";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

const DEVICE_TYPE_LABELS: Partial<Record<DeviceType, string>> = {
  [DeviceType.VOLCANO]: "Volcano Hybrid",
  [DeviceType.VENTY]: "Venty",
  [DeviceType.VEAZY]: "Veazy",
  [DeviceType.CRAFTY]: "Crafty",
};

export const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  return (
    <Button
      variant="outline"
      size="icon"
      class="text-muted-foreground"
      aria-label={m.settings_darkMode()}
      aria-pressed={isDarkMode()}
      onClick={() => toggleDarkMode(!isDarkMode())}
    >
      <Show when={isDarkMode()} fallback={<Moon />}>
        <Sun />
      </Show>
    </Button>
  );
};

const DisconnectButton = () => {
  const { disconnect } = useBluetooth();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        as={Button}
        variant="outline"
        size="icon"
        class="text-muted-foreground"
        aria-label={m.connection_disconnect()}
      >
        <Power />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {m.connection_confirmDisconnect()}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose as={Button} variant="outline">
            {m.common_cancel()}
          </AlertDialogClose>
          <AlertDialogClose
            as={Button}
            variant="destructive"
            onClick={() => disconnect()}
          >
            <Power />
            {m.connection_disconnect()}
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface AppHeaderProps {
  /** Device specific status next to the buttons, e.g. the battery level */
  trailing?: JSX.Element;
}

/** Device name, connection status, theme toggle and disconnect */
export const AppHeader = (props: AppHeaderProps) => {
  const { connectionState, deviceInfo } = useBluetooth();

  const isConnected = () => connectionState() === ConnectionState.CONNECTED;
  const isConnecting = () => connectionState() === ConnectionState.CONNECTING;
  const deviceName = () =>
    DEVICE_TYPE_LABELS[deviceInfo().type] ?? deviceInfo().name;

  return (
    <header class="flex items-center gap-3 pt-[max(1.125rem,env(safe-area-inset-top))] pb-3">
      <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary [&_svg]:size-5">
        <Switch fallback={<BluetoothOff class="text-muted-foreground" />}>
          <Match when={isConnecting()}>
            <LoaderCircle class="animate-spin" />
          </Match>
          <Match when={isConnected()}>
            <Bluetooth />
          </Match>
        </Switch>
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <div class="truncate font-semibold text-base tracking-tight">
          <Show when={isConnected()} fallback={m.connection_notConnected()}>
            {deviceName()}
          </Show>
        </div>
        <div class="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Switch>
            <Match when={isConnecting()}>{m.connection_connecting()}</Match>
            <Match when={isConnected()}>
              <span class="size-1.5 shrink-0 rounded-full bg-success" />
              <span class="truncate">{m.connection_connected()}</span>
            </Match>
          </Switch>
        </div>
      </div>
      {props.trailing}
      <ThemeToggle />
      <Show when={isConnected()}>
        <DisconnectButton />
      </Show>
    </header>
  );
};
