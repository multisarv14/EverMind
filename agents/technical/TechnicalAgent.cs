using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.TechnicalAgent;

public sealed class TechnicalAgent : IAgent
{
    public string Name => "Technical Agent";

    public Intent Intent => Intent.Technical;

    public bool CanHandle(IAgentContext context) => true;

    public Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IAgentResult>(
            new AgentResult(
                true,
                "TechnicalAgent executed: " + context.Input));
    }
}
