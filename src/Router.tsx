import { Route, Router, type RouteSectionProps } from "@solidjs/router";
import { type Component, lazy } from "solid-js";
import { Connect } from "./components/Connect";
import { DeviceRouter } from "./components/DeviceRouter";
import { Layout } from "./components/Layout";
import { ROUTES } from "./routes";

/**
 * Device pages load on demand, so the connect screen does not wait for code
 * of all four devices. The service worker precaches every chunk for offline
 * use.
 */
const page = <T, K extends keyof T>(load: () => Promise<T>, name: K) =>
  lazy(() =>
    load().then((module) => ({
      default: module[name] as Component<RouteSectionProps>,
    }))
  );

const volcano = () => import("./devices/pages/volcano");
const ventyVeazy = () => import("./devices/pages/ventyVeazy");
const crafty = () => import("./devices/pages/crafty");
const history = () => import("./Views/HistoryView");

const WorkflowWrapper = page(volcano, "WorkflowWrapper");
const VolcanoView = page(volcano, "VolcanoView");
const WorkFlowSection = page(volcano, "WorkFlowSection");
const VolcanoSettingsView = page(volcano, "VolcanoSettingsView");
const WorkflowList = page(volcano, "WorkflowList");
const WorkflowForm = page(volcano, "WorkflowForm");
const VentyVeazyShell = page(ventyVeazy, "VentyVeazyShell");
const VentyVeazyView = page(ventyVeazy, "VentyVeazyView");
const VentyVeazySettingsView = page(ventyVeazy, "VentyVeazySettingsView");
const CraftyShell = page(crafty, "CraftyShell");
const CraftyView = page(crafty, "CraftyView");
const CraftySettingsView = page(crafty, "CraftySettingsView");
const HistoryView = page(history, "HistoryView");

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
