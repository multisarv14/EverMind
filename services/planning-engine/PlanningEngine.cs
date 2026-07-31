using EverMind.Application.Abstractions;

namespace EverMind.PlanningEngine;

public sealed class PlanningEngine : IPlanningEngine
{
    public Task PlanAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        context.Items["Plan"] = new Dictionary<string, object>
        {
            ["Status"] = "Created",
            ["Timestamp"] = DateTime.UtcNow,
            ["Steps"] = new[]
            {
                "Understand objective",
                "Create execution strategy",
                "Select best agent",
                "Execute task",
                "Validate result"
            }
        };

        return Task.CompletedTask;
    }
}
