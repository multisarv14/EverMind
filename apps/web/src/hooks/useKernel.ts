"use client";

import { useState } from "react";
import { KernelService } from "@/services/kernel.service";
import { useExecutionSession } from "@/context/ExecutionSessionContext";

export function useKernel() {
  const { setSession, addEvent } = useExecutionSession();
  const [loading, setLoading] = useState(false);

  async function run(message: string) {
    if (!message.trim()) return null;

    setLoading(true);

    setSession(prev => ({
      ...prev,
      objective: message,
      status: "running",
      currentStage: "Understanding",
      response: "",
      events: [],
    }));

    addEvent("Understanding", "Analyzing objective...");

    await new Promise(r => setTimeout(r, 250));

    setSession(prev => ({
      ...prev,
      currentStage: "Planning",
    }));

    addEvent("Planning", "Building execution plan...");

    await new Promise(r => setTimeout(r, 250));

    setSession(prev => ({
      ...prev,
      currentStage: "Selecting Agent",
      selectedAgent: "Chief Agent",
    }));

    addEvent("Selecting Agent", "Chief Agent selected.");

    await new Promise(r => setTimeout(r, 250));

    setSession(prev => ({
      ...prev,
      currentStage: "Executing",
    }));

    addEvent("Executing", "Executing through Kernel...");

    try {
      const result = await KernelService.execute(message);

      if (result.success) {
        setSession(prev => ({
          ...prev,
          status: "completed",
          currentStage: "Completed",
          response: result.data?.response ?? "",
        }));

        addEvent("Completed", "Execution finished successfully.");
      } else {
        setSession(prev => ({
          ...prev,
          status: "failed",
          currentStage: "Failed",
          response: result.error,
        }));

        addEvent("Failed", result.error);
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
