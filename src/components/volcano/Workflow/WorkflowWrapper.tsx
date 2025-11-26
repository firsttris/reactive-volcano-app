import { RouteSectionProps } from "@solidjs/router";
import { VolcanoDeviceProvider } from "../../../provider/VolcanoDeviceProvider";
import { useBluetooth } from "../../../provider/BluetoothProvider";
import { useNavigate } from "@solidjs/router";
import { createEffect } from "solid-js";
import { ConnectionState } from "../../../utils/uuids";
import { buildRoute } from "../../../routes";

/**
 * Wrapper component that provides VolcanoDeviceProvider for workflow routes
 */
export const WorkflowWrapper = (props: RouteSectionProps) => {
  const navigate = useNavigate();
  const { connectionState } = useBluetooth();

  // Redirect to connect page if not connected
  createEffect(() => {
    const state = connectionState();
    if (
      state === ConnectionState.NOT_CONNECTED ||
      state === ConnectionState.CONNECTION_FAILED
    ) {
      navigate(buildRoute.root());
    }
  });

  return <VolcanoDeviceProvider>{props.children}</VolcanoDeviceProvider>;
  
};
