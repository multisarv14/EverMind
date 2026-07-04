namespace EverMind.Application.Abstractions;

public interface IOrchestrator
{
    Task<IAgentResult> ExecuteAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default);
}
