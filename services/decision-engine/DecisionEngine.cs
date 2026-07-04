using EverMind.Application.Abstractions;

namespace EverMind.DecisionEngine;

public sealed class DecisionEngine : IDecisionEngine
{
    public async Task DecideAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
    }
}
