import { type RouteSectionProps, useNavigate } from "@solidjs/router";
import ListIcon from "lucide-solid/icons/list";
import History from "lucide-solid/icons/rotate-ccw-clock";
import SlidersHorizontal from "lucide-solid/icons/sliders-horizontal";
import Thermometer from "lucide-solid/icons/thermometer";
import { createEffect, type JSX, onMount } from "solid-js";
import { m } from "../../../paraglide/messages";
import { useBluetooth } from "../../../provider/BluetoothProvider";
import { LiveSessionProvider } from "../../../provider/LiveSessionProvider";
import { useVolcano, VolcanoProvider } from "../../../provider/VolcanoProvider";
import { WorkflowProvider } from "../../../provider/WorkflowProvider";
import { WorkflowRunnerProvider } from "../../../provider/WorkflowRunnerProvider";
import { buildRoute } from "../../../routes";
import { getHeatStatus } from "../../../utils/heatProgress";
import { ConnectionState } from "../../../utils/uuids";
import { getPendingWorkflowCode } from "../../../utils/workflowShare";
import { DeviceShell } from "../../DeviceShell";
import { RunningWorkflowBar } from "./RunningWorkflowBar";

const VolcanoLiveSession = (props: { children: JSX.Element }) => {
  const { state, derived } = useVolcano();
  return (
    <LiveSessionProvider
      reading={() => ({
        current: state.currentTemp,
        target: state.targetTemp,
        heating: derived.isHeating(),
        reached:
          getHeatStatus(
            state.currentTemp,
            state.targetTemp,
            derived.isHeating()
          ) === "reached",
        pumping: derived.isPumpActive(),
        ready: state.loaded,
      })}
    >
      {props.children}
    </LiveSessionProvider>
  );
};

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
      state === ConnectionState.RECONNECTING ||
      state === ConnectionState.CONNECTION_FAILED
    ) {
      navigate(buildRoute.root());
    }
  });

  // Opened from a share link: go straight to the import
  onMount(() => {
    if (getPendingWorkflowCode()) navigate(buildRoute.volcanoWorkflows());
  });

  return (
    <WorkflowProvider>
      <VolcanoProvider>
        <WorkflowRunnerProvider>
          <VolcanoLiveSession>
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
                  href: buildRoute.volcanoHistory(),
                  label: m.nav_history(),
                  icon: History,
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
          </VolcanoLiveSession>
        </WorkflowRunnerProvider>
      </VolcanoProvider>
    </WorkflowProvider>
  );
};
