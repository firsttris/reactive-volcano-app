import { RouteSectionProps } from "@solidjs/router";
import { VolcanoDeviceProvider } from "../../../provider/VolcanoDeviceProvider";

/**
 * Wrapper component that provides VolcanoDeviceProvider for workflow routes
 */
export const WorkflowWrapper = (props: RouteSectionProps) => {
  return <VolcanoDeviceProvider>{props.children}</VolcanoDeviceProvider>;
};
