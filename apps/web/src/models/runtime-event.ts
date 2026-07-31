export type RuntimeEventType =
  | "understanding"
  | "planning"
  | "agent"
  | "executing"
  | "completed"
  | "failed";

export interface RuntimeEvent {
  id: string;
  type: RuntimeEventType;
  title: string;
  description?: string;
  timestamp: Date;
}
