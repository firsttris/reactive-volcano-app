import { Route, Router } from "@solidjs/router";
import { Connect } from "./components/Connect";
import { DeviceRouter } from "./components/DeviceRouter";
import { Layout } from "./components/Layout";
import { WorkflowForm } from "./components/volcano/Workflow/WorkflowForm";
import { WorkflowList } from "./components/volcano/Workflow/WorkflowList";
import { WorkFlowSection } from "./components/volcano/Workflow/WorkflowSection";
import { WorkflowWrapper } from "./components/volcano/Workflow/WorkflowWrapper";
import { ROUTES } from "./routes";
import { CraftySettingsView } from "./Views/CraftySettingsView";
import { CraftyShell, CraftyView } from "./Views/CraftyView";
import { HistoryView } from "./Views/HistoryView";
import { VentyVeazySettingsView } from "./Views/VentyVeazySettingsView";
import { VentyVeazyShell, VentyVeazyView } from "./Views/VentyVeazyView";
import { VolcanoSettingsView } from "./Views/VolcanoSettingsView";
import { VolcanoView } from "./Views/VolcanoView";

export const Routes = () => {
  // Vite's BASE_URL has a trailing slash ("/reactive-volcano-app/"), which the
  // router would turn into "//connect" and then fail to match any route.
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");

  return (
    <Router base={base || undefined}>
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
            <Route
              path={ROUTES.DEVICE.VOLCANO.WORKFLOWS}
              component={WorkFlowSection}
            />
            <Route
              path={ROUTES.DEVICE.VOLCANO.HISTORY}
              component={HistoryView}
            />
            <Route
              path={ROUTES.DEVICE.VOLCANO.SETTINGS}
              component={VolcanoSettingsView}
            />
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
          <Route
            path={ROUTES.DEVICE.VENTY_VEAZY.BASE}
            component={VentyVeazyShell}
          >
            <Route
              path={ROUTES.DEVICE.VENTY_VEAZY.ROOT}
              component={VentyVeazyView}
            />
            <Route
              path={ROUTES.DEVICE.VENTY_VEAZY.HISTORY}
              component={HistoryView}
            />
            <Route
              path={ROUTES.DEVICE.VENTY_VEAZY.SETTINGS}
              component={VentyVeazySettingsView}
            />
          </Route>

          {/* Crafty device routes */}
          <Route path={ROUTES.DEVICE.CRAFTY.BASE} component={CraftyShell}>
            <Route path={ROUTES.DEVICE.CRAFTY.ROOT} component={CraftyView} />
            <Route
              path={ROUTES.DEVICE.CRAFTY.HISTORY}
              component={HistoryView}
            />
            <Route
              path={ROUTES.DEVICE.CRAFTY.SETTINGS}
              component={CraftySettingsView}
            />
          </Route>
        </Route>
      </Route>
    </Router>
  );
};
