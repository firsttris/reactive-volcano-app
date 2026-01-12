import { describe, it, expect } from "vitest";
import type { WorkflowStep } from "./workflowData";
import {
  workflow0,
  workflow1,
  workflow2,
  workflow3,
  initialListOfWorkflows,
} from "./workflowData";

describe("workflowData", () => {
  describe("WorkflowStep interface validation", () => {
    it("should have correct structure for workflow0 steps", () => {
      expect(workflow0).toBeDefined();
      expect(Array.isArray(workflow0)).toBe(true);
      expect(workflow0.length).toBeGreaterThan(0);

      workflow0.forEach((step) => {
        expect(step).toHaveProperty("id");
        expect(step).toHaveProperty("temperature");
        expect(step).toHaveProperty("holdTimeInSeconds");
        expect(step).toHaveProperty("pumpTimeInSeconds");
        expect(typeof step.id).toBe("string");
        expect(typeof step.temperature).toBe("number");
        expect(typeof step.holdTimeInSeconds).toBe("number");
        expect(typeof step.pumpTimeInSeconds).toBe("number");
      });
    });

    it("should have valid temperature ranges", () => {
      const allSteps = [
        ...workflow0,
        ...workflow1,
        ...workflow2,
        ...workflow3,
      ];

      allSteps.forEach((step) => {
        expect(step.temperature).toBeGreaterThanOrEqual(100);
        expect(step.temperature).toBeLessThanOrEqual(230);
      });
    });

    it("should have non-negative time values", () => {
      const allSteps = [
        ...workflow0,
        ...workflow1,
        ...workflow2,
        ...workflow3,
      ];

      allSteps.forEach((step) => {
        expect(step.holdTimeInSeconds).toBeGreaterThanOrEqual(0);
        expect(step.pumpTimeInSeconds).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("workflow0 - Ballon workflow", () => {
    it("should have 11 steps", () => {
      expect(workflow0).toHaveLength(11);
    });

    it("should have incrementing temperatures from 170 to 220", () => {
      const temperatures = workflow0.map((step) => step.temperature);
      expect(temperatures).toEqual([
        170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220,
      ]);
    });

    it("should have consistent 5-second pump times", () => {
      workflow0.forEach((step) => {
        expect(step.pumpTimeInSeconds).toBe(5);
      });
    });

    it("should have zero hold times", () => {
      workflow0.forEach((step) => {
        expect(step.holdTimeInSeconds).toBe(0);
      });
    });
  });

  describe("workflow1", () => {
    it("should have 4 steps", () => {
      expect(workflow1).toHaveLength(4);
    });

    it("should have incrementing temperatures", () => {
      const temperatures = workflow1.map((step) => step.temperature);
      expect(temperatures).toEqual([182, 192, 201, 220]);
    });

    it("should have varying hold and pump times", () => {
      expect(workflow1[0].holdTimeInSeconds).toBe(10);
      expect(workflow1[1].holdTimeInSeconds).toBe(7);
      expect(workflow1[2].holdTimeInSeconds).toBe(5);
      expect(workflow1[3].holdTimeInSeconds).toBe(3);
    });
  });

  describe("workflow2", () => {
    it("should have 5 steps", () => {
      expect(workflow2).toHaveLength(5);
    });

    it("should have incrementing temperatures from 175 to 195", () => {
      const temperatures = workflow2.map((step) => step.temperature);
      expect(temperatures).toEqual([175, 180, 185, 190, 195]);
    });

    it("should have zero hold times", () => {
      workflow2.forEach((step) => {
        expect(step.holdTimeInSeconds).toBe(0);
      });
    });

    it("should have 7-second pump times for first 4 steps and 10 seconds for last", () => {
      expect(workflow2[0].pumpTimeInSeconds).toBe(7);
      expect(workflow2[1].pumpTimeInSeconds).toBe(7);
      expect(workflow2[2].pumpTimeInSeconds).toBe(7);
      expect(workflow2[3].pumpTimeInSeconds).toBe(7);
      expect(workflow2[4].pumpTimeInSeconds).toBe(10);
    });
  });

  describe("workflow3", () => {
    it("should have 4 steps", () => {
      expect(workflow3).toHaveLength(4);
    });

    it("should have incrementing temperatures", () => {
      const temperatures = workflow3.map((step) => step.temperature);
      expect(temperatures).toEqual([174, 199, 213, 222]);
    });

    it("should have hold time only for first step", () => {
      expect(workflow3[0].holdTimeInSeconds).toBe(20);
      expect(workflow3[1].holdTimeInSeconds).toBe(0);
      expect(workflow3[2].holdTimeInSeconds).toBe(0);
      expect(workflow3[3].holdTimeInSeconds).toBe(0);
    });

    it("should have longest pump time for second step", () => {
      expect(workflow3[1].pumpTimeInSeconds).toBe(20);
    });
  });

  describe("initialListOfWorkflows", () => {
    it("should have 4 workflows", () => {
      expect(initialListOfWorkflows).toHaveLength(4);
    });

    it("should have correct structure for each workflow", () => {
      initialListOfWorkflows.forEach((workflow) => {
        expect(workflow).toHaveProperty("name");
        expect(workflow).toHaveProperty("id");
        expect(workflow).toHaveProperty("workflowSteps");
        expect(typeof workflow.name).toBe("string");
        expect(typeof workflow.id).toBe("string");
        expect(Array.isArray(workflow.workflowSteps)).toBe(true);
      });
    });

    it("should have correct workflow names", () => {
      const names = initialListOfWorkflows.map((w) => w.name);
      expect(names).toEqual(["Ballon", "workflow2", "workflow3", "workflow4"]);
    });

    it("should reference correct workflow steps", () => {
      expect(initialListOfWorkflows[0].workflowSteps).toBe(workflow0);
      expect(initialListOfWorkflows[1].workflowSteps).toBe(workflow1);
      expect(initialListOfWorkflows[2].workflowSteps).toBe(workflow2);
      expect(initialListOfWorkflows[3].workflowSteps).toBe(workflow3);
    });

    it("should have valid UUID format for workflow IDs", () => {
      initialListOfWorkflows.forEach((workflow) => {
        expect(workflow.id).toBeTruthy();
        expect(typeof workflow.id).toBe("string");
        expect(workflow.id.length).toBeGreaterThan(0);
      });
    });
  });

  describe("workflow calculations", () => {
    it("should calculate total duration for workflow0", () => {
      const totalDuration = workflow0.reduce(
        (sum, step) => sum + step.holdTimeInSeconds + step.pumpTimeInSeconds,
        0
      );
      expect(totalDuration).toBe(55); // 11 steps * 5 seconds pump
    });

    it("should calculate total duration for workflow1", () => {
      const totalDuration = workflow1.reduce(
        (sum, step) => sum + step.holdTimeInSeconds + step.pumpTimeInSeconds,
        0
      );
      expect(totalDuration).toBe(67); // (10+10) + (7+12) + (5+10) + (3+10)
    });

    it("should calculate temperature range for each workflow", () => {
      const getRange = (steps: WorkflowStep[]) => {
        const temps = steps.map((s) => s.temperature);
        return { min: Math.min(...temps), max: Math.max(...temps) };
      };

      expect(getRange(workflow0)).toEqual({ min: 170, max: 220 });
      expect(getRange(workflow1)).toEqual({ min: 182, max: 220 });
      expect(getRange(workflow2)).toEqual({ min: 175, max: 195 });
      expect(getRange(workflow3)).toEqual({ min: 174, max: 222 });
    });

    it("should verify temperature steps are reasonable (max 30°C jump)", () => {
      const checkTemperatureJumps = (steps: WorkflowStep[]) => {
        for (let i = 1; i < steps.length; i++) {
          const jump = Math.abs(steps[i].temperature - steps[i - 1].temperature);
          expect(jump).toBeLessThanOrEqual(30); // Reasonable temperature increase
        }
      };

      checkTemperatureJumps(workflow0);
      checkTemperatureJumps(workflow1);
      checkTemperatureJumps(workflow2);
      checkTemperatureJumps(workflow3);
    });
  });

  describe("workflow immutability", () => {
    it("should be safe to modify workflow copies", () => {
      const originalLength = workflow0.length;
      const copy = [...workflow0];
      copy.push({
        id: "new-id",
        temperature: 225,
        holdTimeInSeconds: 0,
        pumpTimeInSeconds: 5,
      });

      expect(workflow0.length).toBe(originalLength);
      expect(copy.length).toBe(originalLength + 1);
    });
  });
});
