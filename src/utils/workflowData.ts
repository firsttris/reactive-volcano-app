import { v4 as uuidv4 } from 'uuid';

export interface WorkflowStep {
  temperature: number;
  holdTimeInSeconds: number;
  pumpTimeInSeconds: number;
}

export const workflow0: WorkflowStep[] = [
  {
    temperature: 170,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 175,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 180,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 185,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 190,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 195,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 200,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 205,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 210,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 215,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
  {
    temperature: 220,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 5,
  },
];

export const workflow1: WorkflowStep[] = [
  {
    temperature: 182,
    holdTimeInSeconds: 10,
    pumpTimeInSeconds: 10,
  },
  {
    temperature: 192,
    holdTimeInSeconds: 7,
    pumpTimeInSeconds: 12,
  },
  {
    temperature: 201,
    holdTimeInSeconds: 5,
    pumpTimeInSeconds: 10,
  },
  {
    temperature: 220,
    holdTimeInSeconds: 3,
    pumpTimeInSeconds: 10,
  },
];

export const workflow2: WorkflowStep[] = [
  {
    temperature: 175,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 7,
  },
  {
    temperature: 180,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 7,
  },
  {
    temperature: 185,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 7,
  },
  {
    temperature: 190,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 7,
  },
  {
    temperature: 195,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 10,
  },
];

export const workflow3: WorkflowStep[] = [
  {
    temperature: 174,
    holdTimeInSeconds: 20,
    pumpTimeInSeconds: 8,
  },
  {
    temperature: 199,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 20,
  },
  {
    temperature: 213,
    holdTimeInSeconds: 0,
    pumpTimeInSeconds: 10,
  },
  {
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


export const initialListOfWorkflows: Workflow[] = [
  {
    name: "Ballon",
    id: uuidv4(),
    workflowSteps: workflow0,
  },
  {
    name: "workflow2",
    id: uuidv4(),
    workflowSteps: workflow1,
  },
  {
    name: "workflow3",
    id: uuidv4(),
    workflowSteps: workflow2,
  },
  {
    name: "workflow4",
    id: uuidv4(),
    workflowSteps: workflow3,
  },
]