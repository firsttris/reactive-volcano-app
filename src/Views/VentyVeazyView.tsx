import { type RouteSectionProps, useNavigate } from "@solidjs/router";
import MapPin from "lucide-solid/icons/map-pin";
import SlidersHorizontal from "lucide-solid/icons/sliders-horizontal";
import Thermometer from "lucide-solid/icons/thermometer";
import { type Component, createEffect, Show } from "solid-js";
import { BatteryChip } from "../components/BatteryChip";
import { DeviceShell } from "../components/DeviceShell";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Temperature } from "../components/veazy-venty/Temperature";
import { m } from "../paraglide/messages";
import { useBluetooth } from "../provider/BluetoothProvider";
import {
  useVentyVeazy,
  VentyVeazyProvider,
} from "../provider/VentyVeazyProvider";
import { buildRoute } from "../routes";
import { ConnectionState } from "../utils/uuids";

/**
 * Shown while the device is switched off in find-my mode: it can only be
 * made to beep until it is switched on again.
 */
const FindMyDeviceBanner: Component = () => {
  const { actions } = useVentyVeazy();
  return (
    <Card class="flex flex-col items-center gap-5 px-6 py-10 text-center">
      <span class="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <MapPin class="size-7" />
      </span>
      <h2 class="font-semibold text-lg">{m.device_findMyDeviceEnabled()}</h2>
      <Button size="lg" onClick={actions.triggerFindMyDevice}>
        {m.settings_findMyDevice()}
      </Button>
      <p class="max-w-xs text-muted-foreground text-sm">
        {m.device_findMyDeviceSwitchOnHint()}
      </p>
    </Card>
  );
};

export const VentyVeazyView: Component = () => {
  const { state } = useVentyVeazy();
  return (
    <Show when={!state.findMyDeviceActive} fallback={<FindMyDeviceBanner />}>
      <Temperature />
    </Show>
  );
};

const VentyVeazyBattery = () => {
  const { state } = useVentyVeazy();
  return (
    <BatteryChip
      level={state.status?.batteryLevel}
      charging={state.status?.isCharging ?? false}
    />
  );
};

/** Wrapper for all Venty/Veazy routes: device store, header and tabs */
export const VentyVeazyShell = (props: RouteSectionProps) => {
  const navigate = useNavigate();
  const { connectionState } = useBluetooth();

  // Redirect to connect page if not connected (the provider renders nothing
  // without a connected device, so this must live outside of it)
  createEffect(() => {
    const state = connectionState();
    if (
      state === ConnectionState.NOT_CONNECTED ||
      state === ConnectionState.CONNECTION_FAILED
    ) {
      navigate(buildRoute.root());
    }
  });

  return (
    <VentyVeazyProvider>
      <DeviceShell
        headerTrailing={<VentyVeazyBattery />}
        tabs={[
          {
            href: buildRoute.ventyVeazyRoot(),
            label: m.nav_control(),
            icon: Thermometer,
          },
          {
            href: buildRoute.ventyVeazySettings(),
            label: m.settings_title(),
            icon: SlidersHorizontal,
          },
        ]}
      >
        {props.children}
      </DeviceShell>
    </VentyVeazyProvider>
  );
};
