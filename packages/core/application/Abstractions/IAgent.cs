namespace EverMind.Application.Abstractions;

public interface IAgent
{
    string Name { get; }

    Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default);
}
