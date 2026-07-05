using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.TestingAgent;

public sealed class TestingAgent : IAgent
{
    public string Name => "Testing Agent";

    public Intent Intent => Intent.Testing;

    public bool CanHandle(IAgentContext context) => true;

    public Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IAgentResult>(
            new AgentResult(
                true,
                "TestingAgent executed: " + context.Input));
    }
}
