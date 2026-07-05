using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.ChiefAgent;

public sealed class ChiefAgent : IAgent
{
    public string Name => "Chief Agent";

    public Intent Intent => Intent.Unknown;

    public bool CanHandle(IAgentContext context)
    {
        return true;
    }

    public Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default)
    {
        var input = context.Input.ToLowerInvariant();

        var target =
            input.Contains("business") ? "BusinessAgent" :
            input.Contains("research") ? "ResearchAgent" :
            input.Contains("document") ? "DocumentationAgent" :
            input.Contains("test") ? "TestingAgent" :
            "TechnicalAgent";

        return Task.FromResult<IAgentResult>(
            new AgentResult(
                true,
                $"ChiefAgent selected {target}"
            )
        );
    }
}
