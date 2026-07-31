export type RuntimeStage =
  | "started"
  | "understanding"
  | "planning"
  | "executing"
  | "completed"
  | "failed";

export const RuntimeMessages: Record<RuntimeStage, string> = {
  started: "Execution started",
  understanding: "Understanding objective",
  planning: "Building execution plan",
  executing: "Executing through Kernel",
  completed: "Execution completed",
  failed: "Execution failed",
};
