import { type RouteSectionProps, useNavigate } from "@solidjs/router";
import ChevronRight from "lucide-solid/icons/chevron-right";
import MapPin from "lucide-solid/icons/map-pin";
import History from "lucide-solid/icons/rotate-ccw-clock";
import SlidersHorizontal from "lucide-solid/icons/sliders-horizontal";
import Thermometer from "lucide-solid/icons/thermometer";
import { type Component, createEffect, type JSX, Show } from "solid-js";
import { BatteryChip } from "../components/BatteryChip";
import { ShutdownTime } from "../components/crafty/ShutdownTime";
import { Temperature } from "../components/crafty/Temperature";
import { DeviceShell } from "../components/DeviceShell";
import { useWakeLock } from "../hooks/utils/useWakeLock";
import { m } from "../paraglide/messages";
import { useBluetooth } from "../provider/BluetoothProvider";
import { CraftyProvider, useCrafty } from "../provider/CraftyProvider";
import { LiveSessionProvider } from "../provider/LiveSessionProvider";
import { buildRoute } from "../routes";
import { ConnectionState } from "../utils/uuids";

export const CraftyView: Component = () => {
  const { actions, derived, isCraftyPlus } = useCrafty();

  // Keep the screen on while the device heats
  useWakeLock(derived.isHeaterActive);

  return (
    <>
      <ShutdownTime />
      <Temperature />
      {/* Find My Device - only Crafty+ */}
      <Show when={isCraftyPlus}>
        <button
          type="button"
          disabled={derived.isFindMyActive()}
          onClick={actions.findMyDevice}
          class="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-60"
        >
          <MapPin class="size-[18px] text-muted-foreground" />
          <span class="flex flex-1 flex-col gap-0.5">
            <span class="font-medium text-sm">{m.settings_findMyDevice()}</span>
            <Show when={derived.isFindMyActive()}>
              <span class="text-primary text-xs">
                {m.settings_findMyDeviceRunning()}
              </span>
            </Show>
          </span>
          <ChevronRight class="size-4 text-muted-foreground" />
        </button>
      </Show>
    </>
  );
};

const CraftyBattery = () => {
  const { state } = useCrafty();
  return <BatteryChip level={state.loaded ? state.batteryLevel : undefined} />;
};

const CraftyLiveSession = (props: { children: JSX.Element }) => {
  const { state, derived } = useCrafty();
  return (
    <LiveSessionProvider
      reading={() => ({
        current: state.currentTemp,
        target: state.targetTemp,
        heating: derived.isHeaterActive(),
        reached: derived.isHeaterActive() && derived.isSetpointReached(),
        ready: state.loaded,
      })}
    >
      {props.children}
    </LiveSessionProvider>
  );
};

/** Wrapper for all Crafty routes: device store, header and tabs */
export const CraftyShell = (props: RouteSectionProps) => {
  const navigate = useNavigate();
  const { connectionState } = useBluetooth();

  // Redirect to connect page if not connected (the provider renders nothing
  // without a connected device, so this must live outside of it)
  createEffect(() => {
    const state = connectionState();
    if (
      state === ConnectionState.NOT_CONNECTED ||
      state === ConnectionState.RECONNECTING ||
      state === ConnectionState.CONNECTION_FAILED
    ) {
      navigate(buildRoute.root());
    }
  });

  return (
    <CraftyProvider>
      <CraftyLiveSession>
        <DeviceShell
          headerTrailing={<CraftyBattery />}
          tabs={[
            {
              href: buildRoute.craftyRoot(),
              label: m.nav_control(),
              icon: Thermometer,
            },
            {
              href: buildRoute.craftyHistory(),
              label: m.nav_history(),
              icon: History,
            },
            {
              href: buildRoute.craftySettings(),
              label: m.settings_title(),
              icon: SlidersHorizontal,
            },
          ]}
        >
          {props.children}
        </DeviceShell>
      </CraftyLiveSession>
    </CraftyProvider>
  );
};
