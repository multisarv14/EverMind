namespace EverMind.Application.Abstractions;

public interface IAIProvider
{
    Task<string> CompleteAsync(
        string prompt,
        CancellationToken cancellationToken = default);
}
