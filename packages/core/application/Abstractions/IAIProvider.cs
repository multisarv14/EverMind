namespace EverMind.Application.Abstractions;

public interface IAIProvider
{
    Task<string> GenerateAsync(
        string prompt,
        CancellationToken cancellationToken = default);
}
