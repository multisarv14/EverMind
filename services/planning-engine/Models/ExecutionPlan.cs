namespace EverMind.PlanningEngine.Models;

public sealed class ExecutionPlan
{
    public string Objective { get; init; } = string.Empty;

    public List<string> Steps { get; init; } = [];

    public string SelectedAgent { get; init; } = string.Empty;
}
