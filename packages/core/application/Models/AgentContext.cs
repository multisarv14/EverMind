using EverMind.Application.Abstractions;

namespace EverMind.Application.Models;

public sealed class AgentContext : IAgentContext
{
    public Guid SessionId { get; init; } = Guid.NewGuid();

    public string Input { get; init; } = string.Empty;

    public IDictionary<string, object> Data { get; } =
        new Dictionary<string, object>();
}
