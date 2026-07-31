using EverMind.Application.Abstractions;

namespace EverMind.DecisionEngine;

public sealed class DecisionEngine : IDecisionEngine
{
    public Task DecideAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        context.Items["Decision"] = new Dictionary<string, object>
        {
            ["Status"] = "Completed",
            ["Timestamp"] = DateTime.UtcNow,
            ["Decision"] = "Execution approved."
        };

        return Task.CompletedTask;
    }
}
