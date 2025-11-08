import { Navigate } from "@solidjs/router";
import { useBluetooth } from "../provider/BluetoothProvider";
import { DeviceType, ConnectionState } from "../utils/uuids";
import { createMemo } from "solid-js";
import { buildRoute } from "../routes";

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
      case DeviceType.UNKNOWN:
      default:
        return buildRoute.connect();
    }
  });

  return <Navigate href={deviceRoute()} />;
};
