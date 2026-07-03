namespace EverMind.Application.Abstractions;

public interface IAgent
{
    string Name { get; }

    string Description { get; }

    Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default);
}
