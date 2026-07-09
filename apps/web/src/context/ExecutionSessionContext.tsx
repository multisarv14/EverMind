"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

export type RuntimeStage =
  | "Idle"
  | "Understanding"
  | "Thinking"
  | "Knowledge"
  | "Planning"
  | "Decision"
  | "Agent"
  | "Memory"
  | "Completed"
  | "Failed";

export interface ExecutionSession {
  objective: string;
  status: ExecutionStatus;
  currentStage: RuntimeStage;
  response?: string;
  selectedAgent?: string;
  events: ExecutionEvent[];
}

interface ExecutionSessionContextValue {
  session: ExecutionSession;
  setSession: React.Dispatch<React.SetStateAction<ExecutionSession>>;
  addEvent: (title: string, description?: string) => void;
}

const ExecutionSessionContext =
  createContext<ExecutionSessionContextValue | null>(null);

export function ExecutionSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<ExecutionSession>({
    objective: "",
    status: "idle",
    currentStage: "Idle",
    selectedAgent: "Chief Agent",
    events: [],
  });

  function addEvent(title: string, description?: string) {
    setSession((prev) => ({
      ...prev,
      events: [
        {
          id: crypto.randomUUID(),
          title,
          description,
          createdAt: new Date(),
        },
        ...prev.events,
      ],
    }));
  }

  const value = useMemo(
    () => ({
      session,
      setSession,
      addEvent,
    }),
    [session]
  );

  return (
    <ExecutionSessionContext.Provider value={value}>
      {children}
    </ExecutionSessionContext.Provider>
  );
}

export function useExecutionSession() {
  const ctx = useContext(ExecutionSessionContext);

  if (!ctx) {
    throw new Error(
      "useExecutionSession must be used inside ExecutionSessionProvider"
    );
  }

  return ctx;
}
