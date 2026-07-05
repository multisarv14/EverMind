export type ExecutionStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface ExecutionEvent {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface ExecutionSession {
  id: string;

  objective: string;

  status: ExecutionStatus;

  response?: string;

  selectedAgent?: string;

  startedAt?: Date;

  completedAt?: Date;

  durationMs?: number;

  events: ExecutionEvent[];
}
