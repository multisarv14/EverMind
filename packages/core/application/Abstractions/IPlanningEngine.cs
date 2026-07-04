namespace EverMind.Application.Abstractions;

public interface IPlanningEngine
{
    Task PlanAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default);
}
