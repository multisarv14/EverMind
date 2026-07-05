using EverMind.Application.Abstractions;

namespace EverMind.Application.Models;

public sealed record AgentResult(
    bool Success,
    string Message
) : IAgentResult;
