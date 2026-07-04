using EverMind.Application.Abstractions;

namespace EverMind.MemoryEngine;

public sealed class MemoryEngine : IMemoryEngine
{
    private readonly Dictionary<Guid, IKernelContext> _sessions = new();

    public Task StoreAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default)
    {
        _sessions[context.SessionId] = context;
        return Task.CompletedTask;
    }

    public Task<IKernelContext?> RecallAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        _sessions.TryGetValue(sessionId, out var context);
        return Task.FromResult(context);
    }
}
