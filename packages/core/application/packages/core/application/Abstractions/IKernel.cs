namespace EverMind.Application.Abstractions;

public interface IKernel
{
    Task<IAgentResult> ExecuteAsync(
        string input,
        CancellationToken cancellationToken = default);
}
