import { Route, Router } from "@solidjs/router";
import { Connect } from "./components/Connect";
import { DeviceRouter } from "./components/DeviceRouter";
import { Layout } from "./components/Layout";
import { WorkflowForm } from "./components/volcano/Workflow/WorkflowForm";
import { WorkflowList } from "./components/volcano/Workflow/WorkflowList";
import { WorkflowWrapper } from "./components/volcano/Workflow/WorkflowWrapper";
import { ROUTES } from "./routes";
import { CraftyView } from "./Views/CraftyView";
import { VentyVeazyView } from "./Views/VentyVeazyView";
import { VolcanoView } from "./Views/VolcanoView";

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

          {/* Crafty device routes */}
          <Route path={ROUTES.DEVICE.CRAFTY} component={CraftyView} />
        </Route>
      </Route>
    </Router>
  );
};
