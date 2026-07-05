export type ExecutionStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface ExecutionState {
  status: ExecutionStatus;
  objective: string;
  response?: string;
  error?: string;
}
