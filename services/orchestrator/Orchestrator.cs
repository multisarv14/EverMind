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

        foreach (var agent in _agents)
        {
            var result = await agent.ExecuteAsync(
                agentContext,
                cancellationToken);

            if (result.Success)
                return result;
        }

        return new AgentResult(
            false,
            "No suitable agent found.");
    }
}
