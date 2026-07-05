export type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

export async function safeAsync<T>(
  action: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await action();

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unexpected error",
    };
  }
}
