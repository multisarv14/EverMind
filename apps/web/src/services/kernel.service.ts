import { executeKernel } from "@/api/kernel";
import { safeAsync } from "@/lib/result";

import type { KernelExecutionResult } from "@/types/kernel-result";

export class KernelService {
  static async execute(message: string): Promise<{ success: boolean; data?: KernelExecutionResult; error?: string }> {
    return safeAsync(() =>
      executeKernel({ message })
    );
  }
}
