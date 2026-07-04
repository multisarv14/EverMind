namespace EverMind.Application.Abstractions;

public interface IKnowledgeEngine
{
    Task SearchAsync(
        IKernelContext context,
        CancellationToken cancellationToken = default);
}
