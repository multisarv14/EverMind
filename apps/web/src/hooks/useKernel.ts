"use client";

import { useState } from "react";
import { KernelService } from "@/services/kernel.service";
import { useExecutionSession } from "@/context/ExecutionSessionContext";

export function useKernel() {
  const { session, setSession, addEvent } = useExecutionSession();
  const [loading, setLoading] = useState(false);

  async function run(message: string) {
    if (!message.trim()) return null;

    setLoading(true);

    setSession({
      ...session,
      objective: message,
      status: "running",
    });

    addEvent(
      "Objective Received",
      message
    );

    try {
      const result = await KernelService.execute(message);

      if (result.success) {
        setSession(prev => ({
          ...prev,
          status: "completed",
          response: result.data?.response ?? "",
        }));

        addEvent(
          "Execution Completed",
          "Kernel returned a response."
        );
      } else {
        setSession(prev => ({
          ...prev,
          status: "failed",
          response: result.error,
        }));

        addEvent(
          "Execution Failed",
          result.error
        );
      }

      return result;

    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    run,
  };
}
