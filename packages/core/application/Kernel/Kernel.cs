using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.Application.Kernel;

public sealed class Kernel : IKernel
{
    private readonly IAgent _chiefAgent;

    public Kernel(IAgent chiefAgent)
    {
        _chiefAgent = chiefAgent;
    }

    public Task<IAgentResult> RunAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        var agentContext = new AgentContext
        {
            SessionId = context.SessionId,
            Input = context.Prompt
        };

        return _chiefAgent.ExecuteAsync(
            agentContext,
            cancellationToken);
    }
}
