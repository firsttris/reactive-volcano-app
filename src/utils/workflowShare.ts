import type { Workflow } from "./workflowData";

/** A workflow without ids, as it travels in a share link */
export interface SharedWorkflow {
  name: string;
  workflowSteps: {
    temperature: number;
    holdTimeInSeconds: number;
    pumpTimeInSeconds: number;
  }[];
}

export const SHARE_PARAM = "workflow";
const MAX_STEPS = 50;
const MAX_NAME_LENGTH = 60;

const toBase64Url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (code: string) => {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/** Compact, URL-safe form: base64url of {n: name, s: [[temp, hold, pump]]} */
export const encodeWorkflow = (workflow: Workflow) =>
  toBase64Url(
    JSON.stringify({
      n: workflow.name,
      s: workflow.workflowSteps.map((step) => [
        step.temperature,
        step.holdTimeInSeconds,
        step.pumpTimeInSeconds,
      ]),
    })
  );

const isValidNumber = (value: unknown, max: number): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= max;

/** The shared workflow, or null if the code is broken or tampered with */
export const decodeWorkflow = (code: string): SharedWorkflow | null => {
  try {
    const data = JSON.parse(fromBase64Url(code));
    if (typeof data?.n !== "string" || !data.n.trim()) return null;
    if (!Array.isArray(data.s) || data.s.length > MAX_STEPS) return null;
    const steps = data.s.map((step: unknown) => {
      if (!Array.isArray(step) || step.length !== 3) throw new Error();
      const [temperature, hold, pump] = step;
      if (
        !isValidNumber(temperature, 230) ||
        !isValidNumber(hold, 3600) ||
        !isValidNumber(pump, 3600)
      ) {
        throw new Error();
      }
      return {
        temperature,
        holdTimeInSeconds: hold,
        pumpTimeInSeconds: pump,
      };
    });
    return {
      name: data.n.trim().slice(0, MAX_NAME_LENGTH),
      workflowSteps: steps,
    };
  } catch {
    return null;
  }
};

/** Link that opens the app and offers to import the workflow */
export const buildShareUrl = (workflow: Workflow, appUrl: string) => {
  const url = new URL(appUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARE_PARAM, encodeWorkflow(workflow));
  return url.toString();
};

const PENDING_KEY = "pendingSharedWorkflow";

/**
 * Takes a shared workflow out of the address bar and keeps it until a
 * Volcano is connected, so the link survives the connect screen
 */
export const capturePendingWorkflow = () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get(SHARE_PARAM);
  if (!code) return;
  try {
    sessionStorage.setItem(PENDING_KEY, code);
  } catch {
    // Without storage the link simply does nothing
  }
  url.searchParams.delete(SHARE_PARAM);
  window.history.replaceState(window.history.state, "", url);
};

export const getPendingWorkflowCode = () => {
  try {
    return sessionStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
};

export const clearPendingWorkflow = () => {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing stored
  }
};
