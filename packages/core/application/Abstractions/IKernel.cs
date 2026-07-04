namespace EverMind.Application.Abstractions;

public interface IKernel
{
    Task<IAgentResult> RunAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default);
}
