import type { KernelRequest, KernelResponse } from "@/types/kernel";
import { API } from "@/config/api";

export async function executeKernel(
  payload: KernelRequest
): Promise<KernelResponse> {

  const response = await fetch(
    `${API.baseUrl}${API.endpoints.kernelExecute}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Kernel API failed (${response.status})`);
  }

  return response.json();
}
