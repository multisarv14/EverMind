namespace EverMind.Memory.Models;

public sealed record MemoryRecord(
    Guid SessionId,
    string Objective,
    string Agent,
    string Response,
    DateTime Timestamp
);
