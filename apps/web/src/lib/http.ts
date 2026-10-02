export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export const unauthorized = () => json({ error: "Please sign in." }, 401);

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const forbidden = (message = "You don't have permission to do that.") => json({ error: message }, 403);
