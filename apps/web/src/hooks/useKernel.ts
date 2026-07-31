"use client";

import { useState } from "react";
import { KernelService } from "@/services/kernel.service";
import { connectRuntimeStream } from "@/services/runtime-stream.service";
import { useExecutionSession } from "@/context/ExecutionSessionContext";

export function useKernel() {
  const { setSession, addEvent } = useExecutionSession();
  const [loading, setLoading] = useState(false);

  async function run(message: string) {
    if (!message.trim() || loading) {
      return null;
    }

    setLoading(true);

    setSession((prev) => ({
      ...prev,
      objective: message,
      status: "running",
      response: "",
      events: [],
    }));

    const stream = connectRuntimeStream((event) => {
      setSession((prev) => ({
        ...prev,
        currentStage: event.stage as typeof prev.currentStage,
      }));

      addEvent(event.stage, event.message);
    });

    try {
      const result = await KernelService.execute(message);

      if (result.success) {
        setSession((prev) => ({
          ...prev,
          status: "completed",
          currentStage: "Completed",
          response: result.data?.response ?? "",
        }));
      } else {
        setSession((prev) => ({
          ...prev,
          status: "failed",
          currentStage: "Failed",
          response: result.error,
        }));

        addEvent("Failed", result.error);
      }

      return result;
    } finally {
      stream.close();
      setLoading(false);
    }
  }

  return {
    loading,
    run,
  };
}
