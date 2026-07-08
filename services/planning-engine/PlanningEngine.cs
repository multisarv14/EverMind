using EverMind.PlanningEngine.Models;

namespace EverMind.PlanningEngine;

public sealed class PlanningEngine : IPlanningEngine
{
    public ExecutionPlan CreatePlan(string objective, string intent)
    {
        return new ExecutionPlan
        {
            Objective = objective,
            SelectedAgent = intent,
            Steps =
            [
                "Understand objective",
                "Create execution strategy",
                "Select best agent",
                "Execute task",
                "Validate result"
            ]
        };
    }
}
