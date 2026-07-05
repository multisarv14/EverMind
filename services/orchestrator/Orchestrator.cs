using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.Orchestrator;

public sealed class Orchestrator : IOrchestrator
{
    private readonly IEnumerable<IAgent> _agents;
    private readonly IUnderstandingEngine _understanding;

    public Orchestrator(
        IEnumerable<IAgent> agents,
        IUnderstandingEngine understanding)
    {
        _agents = agents;
        _understanding = understanding;
    }

    public async Task<IAgentResult> ExecuteAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        var understanding = _understanding.Analyze(context.Prompt);

        var agentContext = new AgentContext
        {
            SessionId = context.SessionId,
            Input = context.Prompt
        };

        var agent = _agents.FirstOrDefault(a => a.Intent == understanding.Intent);

        if (agent is null)
            return new AgentResult(
                false,
                $"No agent registered for {understanding.Intent}");

        return await agent.ExecuteAsync(
            agentContext,
            cancellationToken);
    }
}
