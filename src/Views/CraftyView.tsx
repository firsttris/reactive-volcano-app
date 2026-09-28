import { useNavigate } from "@solidjs/router";
import { type Component, createEffect } from "solid-js";
import { Card } from "../components/Card";
import { HeaterControl } from "../components/crafty/HeaterControl";
import { Settings } from "../components/crafty/Settings";
import { Temperature } from "../components/crafty/Temperature";
import { useWakeLock } from "../hooks/utils/useWakeLock";
import { useBluetooth } from "../provider/BluetoothProvider";
import { CraftyProvider, useCrafty } from "../provider/CraftyProvider";
import { buildRoute } from "../routes";
import { ConnectionState } from "../utils/uuids";

const CraftyViewContent: Component = () => {
  const { derived } = useCrafty();
  // Keep the screen on while the device heats
  useWakeLock(derived.isHeaterActive);

  return (
    <>
      {/* Main Controls */}
      <Card>
        <div style={{ "margin-bottom": "24px" }}>
          <Temperature />
        </div>
        <HeaterControl />
      </Card>

      {/* Settings */}
      <Settings />
    </>
  );
};

export const CraftyView: Component = () => {
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
    <CraftyProvider>
      <CraftyViewContent />
    </CraftyProvider>
  );
};
