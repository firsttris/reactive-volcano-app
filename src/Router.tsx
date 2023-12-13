import { Router, Route } from "@solidjs/router";
import { App } from "./App";
import { Connect } from "./components/Connect/Connect";
import { WorkflowList } from "./components/Workflow/WorkflowList";
import { WorkflowForm } from "./components/Workflow/WorkflowForm";

export const Routes = () => {

    const isProd = import.meta.env.MODE === "production";
    const Start = () => isProd ? <Connect /> : <App />

  return (
    <Router>
        <Route path="/" component={Start} /> 
        <Route path="/workflow-list/:workflowListIndex" component={WorkflowList} />
        <Route path="/workflow-form/:workflowListIndex/:workflowStepIndex" component={WorkflowForm} />
    </Router>
  );
};
