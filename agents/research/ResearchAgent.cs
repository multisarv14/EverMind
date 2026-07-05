using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.ResearchAgent;

public sealed class ResearchAgent : IAgent
{
    public string Name => "Research Agent";

    public Intent Intent => Intent.Research;

    public bool CanHandle(IAgentContext context) => true;

    public Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IAgentResult>(
            new AgentResult(
                true,
                "ResearchAgent executed: " + context.Input));
    }
}
