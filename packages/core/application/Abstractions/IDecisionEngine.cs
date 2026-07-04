namespace EverMind.Application.Abstractions;

public interface IDecisionEngine
{
    Task DecideAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default);
}
