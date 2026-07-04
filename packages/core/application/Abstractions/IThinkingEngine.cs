namespace EverMind.Application.Abstractions;

public interface IThinkingEngine
{
    Task ThinkAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default);
}
