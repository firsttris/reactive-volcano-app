import { describe, expect, it } from "vitest";
import type { Workflow } from "./workflowData";
import { buildShareUrl, decodeWorkflow, encodeWorkflow } from "./workflowShare";

const workflow: Workflow = {
  id: "w1",
  name: "Ballon ⚡",
  workflowSteps: [
    { id: "a", temperature: 170, holdTimeInSeconds: 0, pumpTimeInSeconds: 5 },
    { id: "b", temperature: 185, holdTimeInSeconds: 10, pumpTimeInSeconds: 8 },
  ],
};

describe("workflowShare", () => {
  it("round-trips a workflow without its ids", () => {
    expect(decodeWorkflow(encodeWorkflow(workflow))).toEqual({
      name: "Ballon ⚡",
      workflowSteps: [
        { temperature: 170, holdTimeInSeconds: 0, pumpTimeInSeconds: 5 },
        { temperature: 185, holdTimeInSeconds: 10, pumpTimeInSeconds: 8 },
      ],
    });
  });

  it("produces URL-safe codes", () => {
    expect(encodeWorkflow(workflow)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("rejects broken or invalid codes", () => {
    expect(decodeWorkflow("not-base64!")).toBeNull();
    const bad = btoa(JSON.stringify({ n: "x", s: [[999, 0, 0]] }));
    expect(decodeWorkflow(bad)).toBeNull();
    const noName = btoa(JSON.stringify({ n: " ", s: [] }));
    expect(decodeWorkflow(noName)).toBeNull();
  });

  it("builds a link on the app URL", () => {
    const url = new URL(
      buildShareUrl(workflow, "https://example.com/app/device/volcano?x=1#a")
    );
    expect(url.pathname).toBe("/app/device/volcano");
    expect(url.search.startsWith("?workflow=")).toBe(true);
    expect(url.hash).toBe("");
  });
});
