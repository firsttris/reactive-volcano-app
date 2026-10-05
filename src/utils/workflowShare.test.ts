import { describe, expect, it } from "vitest";
import type { Workflow } from "./workflowData";
import {
  buildShareUrl,
  decodeWorkflow,
  encodeWorkflow,
  parseWorkflowFile,
} from "./workflowShare";

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

  it("raises step temperatures below the Volcano minimum", () => {
    const code = encodeWorkflow({
      id: "x",
      name: "Cold",
      workflowSteps: [
        { id: "a", temperature: 0, holdTimeInSeconds: 0, pumpTimeInSeconds: 5 },
      ],
    });
    expect(decodeWorkflow(code)?.workflowSteps[0].temperature).toBe(40);
  });

  describe("parseWorkflowFile", () => {
    const step = {
      temperature: 180,
      holdTimeInSeconds: 5,
      pumpTimeInSeconds: 10,
    };

    it("accepts an exported workflow", () => {
      expect(
        parseWorkflowFile({ name: " Ballon ", workflowSteps: [step] })
      ).toEqual({ name: "Ballon", workflowSteps: [step] });
    });

    it.each([
      ["a non-string name", { name: 5, workflowSteps: [step] }],
      ["an empty name", { name: "  ", workflowSteps: [step] }],
      ["missing steps", { name: "A" }],
      [
        "a temperature above 230",
        { name: "A", workflowSteps: [{ ...step, temperature: 999 }] },
      ],
      [
        "a negative hold time",
        { name: "A", workflowSteps: [{ ...step, holdTimeInSeconds: -1 }] },
      ],
      ["a step that is no object", { name: "A", workflowSteps: [null] }],
      ["no object", "workflow"],
    ])("rejects %s", (_, data) => {
      expect(parseWorkflowFile(data)).toBeNull();
    });
  });
});
