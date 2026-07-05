using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.DocumentationAgent;

public sealed class DocumentationAgent : IAgent
{
    public string Name => "Documentation Agent";

    public Intent Intent => Intent.Documentation;

    public bool CanHandle(IAgentContext context) => true;

    public Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IAgentResult>(
            new AgentResult(
                true,
                "DocumentationAgent executed: " + context.Input));
    }
}
