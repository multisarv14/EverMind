namespace EverMind.Application.Abstractions;

public interface IExecutionEngine
{
    Task ExecuteAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default);
}
