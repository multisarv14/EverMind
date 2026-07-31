import type { RuntimeStage } from "@/constants/runtime";

export function nextStage(stage: RuntimeStage): RuntimeStage {
  switch (stage) {
    case "Idle":
      return "Understanding";
    case "Understanding":
      return "Planning";
    case "Planning":
      return "Selecting Agent";
    case "Selecting Agent":
      return "Executing";
    case "Executing":
      return "Completed";
    default:
      return "Idle";
  }
}
