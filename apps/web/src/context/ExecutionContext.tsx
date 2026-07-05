"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import type { ExecutionState } from "@/types/execution";
import type { ExecutionEvent } from "@/types/execution-event";

interface ExecutionContextValue {
  execution: ExecutionState;
  setExecution: React.Dispatch<
    React.SetStateAction<ExecutionState>
  >;

  events: ExecutionEvent[];
  addEvent: (event: Omit<ExecutionEvent, "id" | "createdAt">) => void;
}

const ExecutionContext =
  createContext<ExecutionContextValue | null>(null);

export function ExecutionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [execution, setExecution] =
    useState<ExecutionState>({
      status: "idle",
      objective: "",
    });

  const [events, setEvents] = useState<ExecutionEvent[]>([]);

  const addEvent = (event: Omit<ExecutionEvent, "id" | "createdAt">) => {
    setEvents(prev => [
      {
        ...event,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      },
      ...prev,
    ]);
  };

  
    useState<ExecutionState>({
      status: "idle",
      objective: "",
    });

  return (
    <ExecutionContext.Provider
      value={{
        execution,
        setExecution,
        events,
        addEvent,
      }}
    >
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecution() {
  const ctx = useContext(ExecutionContext);

  if (!ctx) {
    throw new Error(
      "useExecution must be used inside ExecutionProvider"
    );
  }

  return ctx;
}
