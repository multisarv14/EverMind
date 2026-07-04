using EverMind.Application.Abstractions;

namespace EverMind.ChiefAgent;

public sealed class ChiefAgent : IAgent
{
    public string Name => "Chief Agent";

    public async Task<IAgentResult> ExecuteAsync(
        IAgentContext context,
        CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;

        return new ChiefAgentResult(
            true,
            $"EverMind understood: {context.Input}"
        );
    }
}

public sealed record ChiefAgentResult(
    bool Success,
    string Message
) : IAgentResult;
