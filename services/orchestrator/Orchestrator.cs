using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.Orchestrator;

public sealed class Orchestrator : IOrchestrator
{
    private readonly IEnumerable<IAgent> _agents;

    public Orchestrator(IEnumerable<IAgent> agents)
    {
        _agents = agents;
    }

    public async Task<IAgentResult> ExecuteAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        var agentContext = new AgentContext
        {
            SessionId = context.SessionId,
            Input = context.Prompt
        };

        Intent intent = DetectIntent(context.Prompt);

        var agent = _agents.FirstOrDefault(a => a.Intent == intent);

        if (agent is null)
        {
            return new AgentResult(false, $"No agent registered for {intent}.");
        }

        return await agent.ExecuteAsync(agentContext, cancellationToken);
    }

    private static Intent DetectIntent(string prompt)
    {
        prompt = prompt.ToLowerInvariant();

        if (prompt.Contains("business"))
            return Intent.Business;

        if (prompt.Contains("research"))
            return Intent.Research;

        if (prompt.Contains("document"))
            return Intent.Documentation;

        if (prompt.Contains("test"))
            return Intent.Testing;

        return Intent.Technical;
    }
}
