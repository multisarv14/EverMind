namespace EverMind.RuntimeStream;

public sealed record RuntimeEvent(
    string Stage,
    string Message,
    DateTime Timestamp
);
