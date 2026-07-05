using EverMind.Application.Abstractions;

namespace EverMind.Application.Kernel;

public sealed class Kernel : IKernel
{
    private readonly IOrchestrator _orchestrator;

    public Kernel(IOrchestrator orchestrator)
    {
        _orchestrator = orchestrator;
    }

    public Task<IAgentResult> RunAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        return _orchestrator.ExecuteAsync(
            context,
            cancellationToken);
    }
}
