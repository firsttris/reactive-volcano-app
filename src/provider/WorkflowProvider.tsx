import type { JSX } from "solid-js";
import { createContext, useContext } from "solid-js";
import { useWorkflow } from "../hooks/volcano/useWorkflow";

type WorkflowContextType = ReturnType<typeof useWorkflow>;

const WorkflowContext = createContext<WorkflowContextType>();

/** Stored Volcano workflows (IndexedDB); independent of the Bluetooth device */
export const WorkflowProvider = (props: { children: JSX.Element }) => {
  const workflow = useWorkflow();
  return (
    <WorkflowContext.Provider value={workflow}>
      {props.children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflowContext = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error(
      "useWorkflowContext must be used within a WorkflowProvider"
    );
  }
  return context;
};
