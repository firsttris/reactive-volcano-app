import { m } from "../paraglide/messages";

export interface WorkflowStep {
  id: string;
  temperature: number;
  holdTimeInSeconds: number;
  pumpTimeInSeconds: number;
}

export const workflow0: WorkflowStep[] = [
  {
    id: "default-step-0",
    temperature: 170,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-1",
    temperature: 175,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-2",
    temperature: 180,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-3",
    temperature: 185,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-4",
    temperature: 190,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-5",
    temperature: 195,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-6",
    temperature: 200,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-7",
    temperature: 205,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-8",
    temperature: 210,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-9",
    temperature: 215,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    id: "default-step-10",
    temperature: 220,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
];

export const workflow1: WorkflowStep[] = [
  {
    id: "default-step-11",
    temperature: 182,
    holdTimeInSeconds: 10,
    pumpTimeInSeconds: 10,
  },
  {
    id: "default-step-12",
    temperature: 192,
    holdTimeInSeconds: 7,
    pumpTimeInSeconds: 12,
  },
  {
    id: "default-step-13",
    temperature: 201,
    holdTimeInSeconds: 5,
    pumpTimeInSeconds: 10,
  },
  {
    id: "default-step-14",
    temperature: 220,
    holdTimeInSeconds: 3,
    pumpTimeInSeconds: 10,
  },
];

export const workflow2: WorkflowStep[] = [
  {
    id: "default-step-15",
    temperature: 175,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 7,
  },
  {
    id: "default-step-16",
    temperature: 180,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 7,
  },
  {
    id: "default-step-17",
    temperature: 185,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 7,
  },
  {
    id: "default-step-18",
    temperature: 190,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 7,
  },
  {
    id: "default-step-19",
    temperature: 195,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 10,
  },
];

export const workflow3: WorkflowStep[] = [
  {
    id: "default-step-20",
    temperature: 174,
    holdTimeInSeconds: 20,
    pumpTimeInSeconds: 8,
  },
  {
    id: "default-step-21",
    temperature: 199,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 20,
  },
  {
    id: "default-step-22",
    temperature: 213,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 10,
  },
  {
    id: "default-step-23",
    temperature: 222,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 10,
  },
];

export interface Workflow {
  name: string;
  id: string;
  workflowSteps: WorkflowStep[];
}

// Fixed ids, so links and the selection survive until the list is first saved
export const initialListOfWorkflows: Workflow[] = [
  {
    name: m.workflow_defaultBalloon(),
    id: "default-ballon",
    workflowSteps: workflow0,
  },
  {
    name: m.workflow_defaultName({ number: 2 }),
    id: "default-2",
    workflowSteps: workflow1,
  },
  {
    name: m.workflow_defaultName({ number: 3 }),
    id: "default-3",
    workflowSteps: workflow2,
  },
  {
    name: m.workflow_defaultName({ number: 4 }),
    id: "default-4",
    workflowSteps: workflow3,
  },
];
