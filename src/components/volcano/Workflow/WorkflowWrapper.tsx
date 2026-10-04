import { type RouteSectionProps, useNavigate } from "@solidjs/router";
import ListIcon from "lucide-solid/icons/list";
import SlidersHorizontal from "lucide-solid/icons/sliders-horizontal";
import Thermometer from "lucide-solid/icons/thermometer";
import { createEffect } from "solid-js";
import { m } from "../../../paraglide/messages";
import { useBluetooth } from "../../../provider/BluetoothProvider";
import { VolcanoProvider } from "../../../provider/VolcanoProvider";
import { WorkflowProvider } from "../../../provider/WorkflowProvider";
import { WorkflowRunnerProvider } from "../../../provider/WorkflowRunnerProvider";
import { buildRoute } from "../../../routes";
import { ConnectionState } from "../../../utils/uuids";
import { DeviceShell } from "../../DeviceShell";
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
          <DeviceShell
            tabs={[
              {
                href: buildRoute.volcanoRoot(),
                label: m.nav_control(),
                icon: Thermometer,
              },
              {
                href: buildRoute.volcanoWorkflows(),
                label: m.workflow_title(),
                icon: ListIcon,
                alsoActiveOn: ["/device/volcano/workflow/*"],
              },
              {
                href: buildRoute.volcanoSettings(),
                label: m.settings_title(),
                icon: SlidersHorizontal,
              },
            ]}
          >
            {props.children}
            <RunningWorkflowBar />
          </DeviceShell>
        </WorkflowRunnerProvider>
      </VolcanoProvider>
    </WorkflowProvider>
  );
};
