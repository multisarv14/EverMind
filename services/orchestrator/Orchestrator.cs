using EverMind.Application.Abstractions;
using EverMind.Application.Models;
using EverMind.Memory;
using EverMind.Memory.Models;
using EverMind.RuntimeStream;

namespace EverMind.Orchestrator;

public sealed class Orchestrator : IOrchestrator
{
    private readonly IEnumerable<IAgent> _agents;
    private readonly IUnderstandingEngine _understanding;
    private readonly IRuntimeStream _runtime;
    private readonly IMemoryStore _memory;

    public Orchestrator(
        IEnumerable<IAgent> agents,
        IUnderstandingEngine understanding,
        IRuntimeStream runtime,
        IMemoryStore memory)
    {
        _agents = agents;
        _understanding = understanding;
        _runtime = runtime;
        _memory = memory;
    }

    public async Task<IAgentResult> ExecuteAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        _runtime.Clear();

        _runtime.Publish(
            "Understanding",
            "Analyzing objective...");

        var understanding =
            _understanding.Analyze(context.Prompt);

        _runtime.Publish(
            "Planning",
            $"Intent: {understanding.Intent}");

        var agentContext = new AgentContext
        {
            SessionId = context.SessionId,
            Input = context.Prompt
        };

        var agent =
            _agents.FirstOrDefault(a => a.Intent == understanding.Intent);

        if (agent is null)
        {
            _runtime.Publish(
                "Failed",
                $"No agent registered for {understanding.Intent}");

            return new AgentResult(
                false,
                $"No agent registered for {understanding.Intent}");
        }

        _runtime.Publish(
            "Agent",
            agent.GetType().Name);

        _runtime.Publish(
            "Executing",
            "Executing selected agent...");

        var result =
            await agent.ExecuteAsync(
                agentContext,
                cancellationToken);

        _memory.Save(
            new MemoryRecord(
                context.SessionId,
                context.Prompt,
                agent.GetType().Name,
                result.Message,
                DateTime.UtcNow
            )
        );

        _runtime.Publish(
            result.Success ? "Completed" : "Failed",
            result.Message);

        return result;
    }
}
