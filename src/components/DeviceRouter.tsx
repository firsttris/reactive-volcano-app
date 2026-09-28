import { Navigate } from "@solidjs/router";
import { createMemo } from "solid-js";
import { useBluetooth } from "../provider/BluetoothProvider";
import { buildRoute } from "../routes";
import { ConnectionState, DeviceType } from "../utils/uuids";

/**
 * Component that automatically navigates to the appropriate device view
 * based on the currently connected device
 */
export const DeviceRouter = () => {
  const { deviceInfo, connectionState } = useBluetooth();

  const deviceRoute = createMemo(() => {
    // Always go to connect page if not connected
    if (connectionState() !== ConnectionState.CONNECTED) {
      return buildRoute.connect();
    }

    const device = deviceInfo();

    switch (device.type) {
      case DeviceType.VOLCANO:
        return buildRoute.volcanoRoot();
      case DeviceType.VENTY:
      case DeviceType.VEAZY:
        return buildRoute.ventyVeazyRoot();
      case DeviceType.CRAFTY:
        return buildRoute.craftyRoot();
      default:
        return buildRoute.connect();
    }
  });

  return <Navigate href={deviceRoute()} />;
};
