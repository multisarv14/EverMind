using EverMind.Application.Abstractions;

namespace EverMind.Orchestrator;

public sealed class Orchestrator : IOrchestrator
{
    public async Task<IAgentResult> ExecuteAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;

        return new OrchestratorResult(
            true,
            $"Pipeline started for: {context.Prompt}"
        );
    }
}

public sealed record OrchestratorResult(
    bool Success,
    string Message
) : IAgentResult;
