export type ExecutionEventType =
  | "started"
  | "completed"
  | "failed";

export interface ExecutionEvent {
  id: string;
  type: ExecutionEventType;
  title: string;
  description?: string;
  createdAt: Date;
}
