using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.BusinessAgent;

public sealed class BusinessAgent : IAgent
{
    public string Name => "Business Agent";

    public Intent Intent => Intent.Business;

    public bool CanHandle(IAgentContext context) => true;

    public Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IAgentResult>(
            new AgentResult(
                true,
                "BusinessAgent executed: " + context.Input));
    }
}
