import { RouteSectionProps } from "@solidjs/router";
import { VolcanoProvider } from "../../../provider/VolcanoProvider";
import { WorkflowProvider } from "../../../provider/WorkflowProvider";
import { useBluetooth } from "../../../provider/BluetoothProvider";
import { useNavigate } from "@solidjs/router";
import { createEffect } from "solid-js";
import { ConnectionState } from "../../../utils/uuids";
import { buildRoute } from "../../../routes";

/**
 * Wrapper for all Volcano routes: provides the device store and workflows
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

  return (
    <WorkflowProvider>
      <VolcanoProvider>{props.children}</VolcanoProvider>
    </WorkflowProvider>
  );
};
