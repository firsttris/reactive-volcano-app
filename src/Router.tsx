import { Router, Route } from "@solidjs/router";
import { App } from "./App";
import { Connect } from "./components/Connect/Connect";
import { WorkflowList } from "./components/Workflow/WorkflowList";

export const Routes = () => {

    const isProd = import.meta.env.MODE === "production";
    const Start = () => isProd ? <Connect /> : <App />

  return (
    <Router>
        <Route path="/" component={Start} /> 
        <Route path="/workflow-details/:workflowIndex" component={WorkflowList} />
        <Route path="/workflow-step-details/:workflowIndex/:workflowStepIndex" component={WorkflowList} />
    </Router>
  );
};
