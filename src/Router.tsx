import { Router, Route } from "@solidjs/router";
import { Connect } from "./components/Connect";
import { WorkflowList } from "./components/volcano/Workflow/WorkflowList";
import { WorkflowForm } from "./components/volcano/Workflow/WorkflowForm";
import { WorkflowWrapper } from "./components/volcano/Workflow/WorkflowWrapper";
import { VolcanoView } from "./Views/VolcanoView";
import { VentyVeazyView } from "./Views/VentyVeazyView";
import { DeviceRouter } from "./components/DeviceRouter";
import { Layout } from "./components/Layout";
import { ROUTES } from "./routes";

export const Routes = () => {
  const base = import.meta.env.BASE_URL;

  return (
    <Router base={base !== "/" ? base : undefined}>
      <Route path={ROUTES.ROOT} component={Layout}>
        {/* Auto-navigation based on connected device */}
        <Route path={ROUTES.ROOT} component={DeviceRouter} />

        {/* Connection screen when no device is connected */}
        <Route path={ROUTES.CONNECT} component={Connect} />

        {/* Device-specific views */}
        <Route path={ROUTES.DEVICE.BASE}>
          {/* Volcano device routes - all wrapped with VolcanoDeviceProvider */}
          <Route path={ROUTES.DEVICE.VOLCANO.BASE} component={WorkflowWrapper}>
            <Route path={ROUTES.DEVICE.VOLCANO.ROOT} component={VolcanoView} />
            <Route path={ROUTES.DEVICE.VOLCANO.WORKFLOW.BASE}>
              <Route
                path={ROUTES.DEVICE.VOLCANO.WORKFLOW.LIST}
                component={WorkflowList}
              />
              <Route
                path={ROUTES.DEVICE.VOLCANO.WORKFLOW.FORM}
                component={WorkflowForm}
              />
            </Route>
          </Route>

          {/* Venty/Veazy device routes */}
          <Route path={ROUTES.DEVICE.VENTY_VEAZY} component={VentyVeazyView} />
        </Route>
      </Route>
    </Router>
  );
};
