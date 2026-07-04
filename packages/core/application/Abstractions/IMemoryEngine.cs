namespace EverMind.Application.Abstractions;

public interface IMemoryEngine
{
    Task StoreAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default);

    Task<IKernelContext?> RecallAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default);
}
