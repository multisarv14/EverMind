using EverMind.Application.Models;

namespace EverMind.Application.Abstractions;

public interface IAgent
{
    string Name { get; }

    Intent Intent { get; }

    bool CanHandle(IAgentContext context);

    Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default);
}
