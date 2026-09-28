import { type RouteSectionProps, useNavigate } from "@solidjs/router";
import { createEffect } from "solid-js";
import { useBluetooth } from "../../../provider/BluetoothProvider";
import { VolcanoProvider } from "../../../provider/VolcanoProvider";
import { WorkflowProvider } from "../../../provider/WorkflowProvider";
import { WorkflowRunnerProvider } from "../../../provider/WorkflowRunnerProvider";
import { buildRoute } from "../../../routes";
import { ConnectionState } from "../../../utils/uuids";
import { RunningWorkflowBar } from "./RunningWorkflowBar";

/**
 * Wrapper for all Volcano routes: provides the device store, workflows and
 * the workflow runner, whose status bar stays visible on every Volcano page
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
      <VolcanoProvider>
        <WorkflowRunnerProvider>
          {props.children}
          <RunningWorkflowBar />
        </WorkflowRunnerProvider>
      </VolcanoProvider>
    </WorkflowProvider>
  );
};
