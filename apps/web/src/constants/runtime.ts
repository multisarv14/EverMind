export const RuntimeStages = [
  "Idle",
  "Understanding",
  "Planning",
  "Selecting Agent",
  "Executing",
  "Completed",
] as const;

export type RuntimeStage = typeof RuntimeStages[number];
